import pool from "../config/db.js";

class ChannelRepository {
  async countChannelsByAdminTgId(adminTgId) {
    const query = `
      SELECT COUNT(*)::int as channel_count 
      FROM channels 
      WHERE admin_tg_id = $1;
    `;
    const result = await pool.query(query, [adminTgId.toString()]);
    const count = result.rows[0].channel_count;
    return count;
  }

  async findChannelsByAdminId(adminId) {
    const query = `
      SELECT 
        c.id, 
        c.tg_channel_id, 
        c.title, 
        c.created_at
      FROM channels c
      WHERE c.admin_tg_id = $1
      ORDER BY c.created_at DESC;
    `;

    const result = await pool.query(query, [adminId]);
    return result.rows;
  }

  async checkChannelOwnership(channelId, adminId) {
    const query = "SELECT id FROM channels WHERE id = $1 AND admin_tg_id = $2";
    const result = await pool.query(query, [channelId, adminId]);
    return result.rows.length > 0;
  }

  async getChannelById(channelId) {
    const query = "SELECT * FROM channels WHERE id = $1";
    const { rows } = await pool.query(query, [channelId]);
    return rows[0];
  }

  async getChannelDashboardData(channelId) {
    const crmQuery = `
    SELECT 
      COALESCE(COUNT(CASE WHEN is_currently_active = TRUE THEN 1 END), 0)::INT as active_customers_count,
      COALESCE(AVG(total_paid_usdt), 0.00)::NUMERIC(10,2) as average_ltv
    FROM channel_customers
    WHERE channel_id = $1;
  `;

    const statsQuery = `
    WITH date_range AS (
      -- Генерируем идеальную сетку из последних 7 дней (включая сегодня)
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '6 days', 
        CURRENT_DATE, 
        '1 day'::interval
      )::date AS date_bucket
    )
    SELECT 
      TO_CHAR(dr.date_bucket, 'DD.MM') as day, -- Красивая дата для фронта
      COALESCE(cds.earnings_usdt, 0.0000) as earnings,
      COALESCE(cds.earnings_stars, 0) as earnings_stars,
      COALESCE(cds.new_subscriptions, 0) as new_subs,
      COALESCE(cds.expired_subscriptions, 0) as expired_subs
    FROM date_range dr
    LEFT JOIN channel_daily_stats cds 
      ON dr.date_bucket = cds.date 
      AND cds.channel_id = $1
    ORDER BY dr.date_bucket ASC; -- Хронология для Recharts
  `;

    const totalsQuery = `
    SELECT 
      COALESCE(SUM(earnings_usdt), 0.00)::NUMERIC(10,2) as total_usdt_earned,
      COALESCE(SUM(earnings_stars), 0.00)::NUMERIC(10,2) as total_stars_earned
    FROM channel_daily_stats
    WHERE channel_id = $1;
  `;

    const [crmRes, statsRes, totalsRes] = await Promise.all([
      pool.query(crmQuery, [channelId]),
      pool.query(statsQuery, [channelId]),
      pool.query(totalsQuery, [channelId]),
    ]);

    const crmData = crmRes.rows[0];
    const totalsData = totalsRes.rows[0];

    return {
      active_customers_count: crmData.active_customers_count,
      average_ltv: crmData.average_ltv,
      total_usdt_earned: totalsData.total_usdt_earned,
      total_stars_earned: totalsData.total_stars_earned,
      graph_data: statsRes.rows,
    };
  }

  async updateChannel(channelId, updateFields) {
    const keys = Object.keys(updateFields);
    if (keys.length === 0) return null;

    const setQuery = keys
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");

    const query = `
      UPDATE channels 
      SET ${setQuery} 
      WHERE id = $1 
      RETURNING *;
    `;

    const values = [channelId, ...Object.values(updateFields)];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async findAllActiveTokens() {
    const query = `
    SELECT id, bot_token 
    FROM channels 
    WHERE bot_token IS NOT NULL AND bot_token != '';
  `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async findActiveTariffsByChannelId(channelId) {
    const query = `
      SELECT t.*, dc.code as currency_code, dc.name as currency_name
      FROM tariffs t
      JOIN dictionary_currencies dc ON t.currency_id = dc.id
      WHERE t.channel_id = $1 AND t.is_active = TRUE
      ORDER BY t.duration_days ASC
    `;
    const result = await pool.query(query, [channelId]);
    return result.rows;
  }

  async findTariffWithCurrency(tariffId) {
    const query = `
      SELECT t.*, dc.code as currency_code, dc.name as currency_name
      FROM tariffs t
      JOIN dictionary_currencies dc ON t.currency_id = dc.id
      WHERE t.id = $1
    `;
    const res = await pool.query(query, [tariffId]);
    return res.rows[0] || null;
  }

  async checkTariffOwnership(tariffId, adminTgId) {
    const query = `
      SELECT t.id 
      FROM platform_services t
      JOIN channels c ON t.channel_id = c.id
      WHERE t.id = $1 AND c.admin_tg_id = $2;
    `;
    const result = await pool.query(query, [tariffId, adminTgId]);
    return result.rows.length > 0;
  }

  async softDeleteTariff(tariffId) {
    const query = `UPDATE platform_services SET is_active = FALSE WHERE id = $1;`;
    await pool.query(query, [tariffId]);
    return true;
  }

  async findChannelById(channelId) {
    const query = "SELECT * FROM channels WHERE id = $1";
    const result = await pool.query(query, [channelId]);
    return result.rows[0] || null;
  }

  async upsertChannel(adminId, tgChannelId, channelTitle) {
    const query = `
      INSERT INTO channels (admin_tg_id, tg_channel_id, title) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (tg_channel_id) 
      DO UPDATE SET title = $3
      RETURNING *;
    `;
    const res = await pool.query(query, [adminId, tgChannelId, channelTitle]);
    return res.rows[0];
  }

  async upsertStats(channelId, { amount = 0, type = "new" }, txClient = pool) {
    let newSub = 0;
    let renewedSub = 0;
    let expiredSub = 0;

    if (type === "new") {
      newSub = 1;
    } else if (type === "renewal") {
      renewedSub = 1;
    } else if (type === "expire") {
      expiredSub = 1;
    }

    const statsQuery = `
    INSERT INTO channel_daily_stats 
      (channel_id, date, earnings_usdt, new_subscriptions, expired_subscriptions, renewed_subscriptions)
    VALUES 
      ($1, CURRENT_DATE, $2, $3, $4, $5)
    ON CONFLICT (channel_id, date) 
    DO UPDATE SET 
      earnings_usdt = channel_daily_stats.earnings_usdt + EXCLUDED.earnings_usdt,
      new_subscriptions = channel_daily_stats.new_subscriptions + EXCLUDED.new_subscriptions,
      renewed_subscriptions = channel_daily_stats.renewed_subscriptions + EXCLUDED.renewed_subscriptions,
      expired_subscriptions = channel_daily_stats.expired_subscriptions + EXCLUDED.expired_subscriptions
    RETURNING *;`;

    await txClient.query(statsQuery, [
      channelId,
      amount,
      newSub,
      expiredSub,
      renewedSub,
    ]);
  }

  async getStatsByPeriod(channelId, period) {
    if (period === "7d" || period === "30d") {
      const days = period === "7d" ? 7 : 30;

      const intervalDays = `${days - 1} days`;

      const query = `
      WITH date_range AS (
        SELECT generate_series(
          CURRENT_DATE - $2::interval, 
          CURRENT_DATE, 
          '1 day'::interval
        )::date AS date_bucket
      )
      SELECT 
        TO_CHAR(dr.date_bucket, 'DD.MM') as day,
        COALESCE(cds.earnings_usdt, 0.0000) as earnings,
        COALESCE(cds.new_subscriptions, 0) as new_subs,
        COALESCE(cds.expired_subscriptions, 0) as expired_subs,
        COALESCE(cds.renewed_subscriptions, 0) as renewed_subscriptions
      FROM date_range dr
      LEFT JOIN channel_daily_stats cds 
        ON dr.date_bucket = cds.date 
        AND cds.channel_id = $1
      ORDER BY dr.date_bucket ASC;
    `;

      const res = await pool.query(query, [channelId, intervalDays]);
      return res.rows;
    }

    if (period === "all") {
      const query = `
      SELECT 
        TO_CHAR(date, 'DD.MM') as day,
        COALESCE(earnings_usdt, 0.0000) as earnings,
        COALESCE(new_subscriptions, 0) as new_subs,
        COALESCE(expired_subscriptions, 0) as expired_subs,
        COALESCE(renewed_subscriptions, 0) as renewed_subscriptions
      FROM channel_daily_stats
      WHERE channel_id = $1
      ORDER BY date ASC;
    `;

      const res = await pool.query(query, [channelId]);
      return res.rows;
    }

    throw createError(400, `Неподдерживаемый период статистики: ${period}`);
  }
}

export const channelRepository = new ChannelRepository();
