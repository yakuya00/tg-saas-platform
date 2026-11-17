import pool from "../config/db.js";

class FinanceRepository {
  async getAvailableStarsBalance(channelId) {
    const query = `
      SELECT 
        COALESCE((
          SELECT SUM(p.amount) 
          FROM payments p 
          JOIN dictionary_currencies dc ON p.currency_id = dc.id 
          WHERE p.channel_id = $1 
            AND p.status = 'success' 
            AND dc.code = 'STARS' 
            AND p.available_at <= NOW()
        ), 0)::NUMERIC - 
        COALESCE((
          SELECT SUM(w.amount) 
          FROM withdrawal_requests w 
          WHERE w.channel_id = $1 
            AND w.currency = 'STARS' 
            AND w.status = 'approved'
        ), 0)::NUMERIC as usd_available;
    `;
    const res = await pool.query(query, [channelId]);
    return parseFloat(res.rows[0]?.usd_available || 0);
  }

  async createWithdrawalRecord(
    {
      id = null,
      adminTgId,
      amount,
      currencyId,
      walletAddress = "By CryptoBot",
      status = "pending",
    },
    txClient = pool,
  ) {
    if (id) {
      const updateQuery = `
        UPDATE withdrawal_requests 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, amount;
      `;
      const res = await txClient.query(updateQuery, [status, id]);
      return res.rows[0];
    }

    const insertQuery = `
      INSERT INTO withdrawal_requests (
        admin_tg_id, 
        amount, 
        currency_id, 
        wallet_address, 
        status, 
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, status, amount;
    `;

    const res = await txClient.query(insertQuery, [
      adminTgId.toString(),
      amount,
      currencyId,
      walletAddress,
      status,
    ]);

    return res.rows[0];
  }

  async getTotalUsdtBalance(adminTgId) {
    const query = `
      SELECT COALESCE(SUM(p.net_amount), 0) as total_usdt
      FROM payments p
      JOIN channels c ON p.channel_id = c.id
      WHERE c.admin_tg_id = $1 AND p.status IN ('success', 'pending');
    `;
    const res = await pool.query(query, [adminTgId]);
    return parseFloat(res.rows[0]?.total_usdt || 0);
  }

  async getAvailableUSDTBalance(adminTgId) {
    const query = `
      SELECT 
        COALESCE(balance_available, 0.00) as "available",
        COALESCE(balance_hold, 0.00) as "inHold",
        (COALESCE(balance_available, 0.00) + COALESCE(balance_hold, 0.00)) as "totalEarned",
        CASE WHEN balance_hold > 0 THEN true ELSE false END as "hasHold",
        COALESCE(balance_available, 0.00) as "totalUsdt"
      FROM users
      WHERE tg_id = $1;
    `;
    const res = await pool.query(query, [adminTgId]);

    if (res.rows.length === 0) {
      return {
        available: 0,
        inHold: 0,
        totalEarned: 0,
        hasHold: false,
        totalUsdt: 0,
      };
    }

    const row = res.rows[0];
    return {
      available: parseFloat(row.available),
      inHold: parseFloat(row.inHold),
      totalEarned: parseFloat(row.totalEarned),
      hasHold: row.hasHold,
      totalUsdt: parseFloat(row.totalUsdt),
    };
  }

  async getRecentTransactions(adminTgId) {
    const query = `
      SELECT 
        id as payment_id,
        'Вывод средств' as channel_title,
        amount as amount_formatted,
        wallet_address,
        CASE 
          WHEN status = 'pending' THEN true 
          ELSE false 
        END as "isHold",
        status, -- 'pending', 'success', 'failed'
        created_at,
        TO_CHAR(created_at, 'DD.MM.YYYY') as "dateFormatted",
        TO_CHAR(created_at, 'HH24:MI') as "timeFormatted"
      FROM withdrawal_requests
      WHERE admin_tg_id = $1
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    const res = await pool.query(query, [adminTgId]);

    return res.rows.map((tx) => ({
      ...tx,
      amountFormatted: parseFloat(tx.amount_formatted),
    }));
  }
}

export const financeRepository = new FinanceRepository();
