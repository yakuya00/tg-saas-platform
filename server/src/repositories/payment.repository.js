import pool from "../config/db.js";

class PaymentRepository {
  async findTariffWithDetails(tariffId) {
    const query = `
      SELECT t.*, dc.code as currency_code, c.id as channel_db_id
      FROM tariffs t
      JOIN dictionary_currencies dc ON t.currency_id = dc.id
      JOIN channels c ON t.channel_id = c.id
      WHERE t.id = $1 AND t.is_active = TRUE;
    `;
    const res = await pool.query(query, [tariffId]);
    return res.rows[0] || null;
  }

  async findGatewayIdByCode(gatewayCode) {
    const query = "SELECT id FROM dictionary_gateways WHERE code = $1";
    const res = await pool.query(query, [gatewayCode]);
    return res.rows[0]?.id || null;
  }

  async createPaymentRecord(data) {
    const query = `
      INSERT INTO payments (
        service_id, 
        subscription_id, 
        user_tg_id, 
        channel_id, 
        amount, 
        net_amount, 
        currency_id, 
        gateway_id, 
        gateway_invoice_id,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      data.serviceId,
      data.subscriptionId,
      data.userTgId,
      data.channelId,
      data.amount,
      data.netAmount,
      data.currencyId,
      data.gatewayId,
      data.gatewayInvoiceId,
    ]);

    return rows[0];
  }

  async findPaymentDetailsByInvoiceId(gatewayInvoiceId) {
    console.log(gatewayInvoiceId);
    const query = `
      SELECT p.id as payment_id, p.amount as real_paid_amount, p.user_tg_id, p.channel_id, p.subscription_id, p.status as payment_status, p.net_amount as net_amount,
             ps.id as real_service_id, ps.duration_days as real_duration_days, ps.price as real_service_price, ps.type as service_type,
             c.tg_channel_id, c.id as channel_db_id, c.title as channel_title,
             s.status as sub_status, s.expires_at as sub_current_expires, s.service_id as old_sub_service_id,
             u.tg_id as admin_id
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      JOIN platform_services ps ON s.service_id = ps.id 
      JOIN channels c ON p.channel_id = c.id
      JOIN users u on c.admin_tg_id = u.tg_id
      WHERE p.gateway_invoice_id = $1;
    `;
    const res = await pool.query(query, [gatewayInvoiceId]);
    return res.rows[0] || null;
  }

  async confirmPayment(paymentId, txClient = pool) {
    const query = `UPDATE payments SET status = 'success', available_at = NOW() WHERE id = $1;`;
    await txClient.query(query, [paymentId]);
  }

  async updatePaymentStatus(paymentId, status, txClient = pool) {
    if (!paymentId || !status) {
      throw new Error(
        "⛔ [REPOSITORY ERROR] Не переданы paymentId или status для обновления платежа",
      );
    }

    const queryText = `
      UPDATE payments 
      SET 
        status = $1,
      WHERE id = $2
      RETURNING id, payment_status;
    `;

    try {
      const { rows } = await txClient.query(queryText, [status, paymentId]);

      if (rows.length === 0) {
        console.warn(
          `⚠️ [REPOSITORY] Платеж с ID ${paymentId} не найден для обновления статуса на "${status}"`,
        );
        return null;
      }

      console.log(
        `✅ [DB UPDATE] Статус платежа #${paymentId} успешно изменен на: "${rows[0].payment_status}"`,
      );
      return rows[0];
    } catch (error) {
      console.error(
        `❌ [DB ERROR] Крах при выполнении updatePaymentStatus для платежа #${paymentId}:`,
        error.message,
      );
      throw error;
    }
  }

  async addChannelBalance(channelId, adminShare, txClient = pool) {
    const query = `UPDATE channels SET balance_usdt = balance_usdt + $1 WHERE id = $2;`;
    await txClient.query(query, [adminShare, channelId]);
  }

  async updateSubscriptionInviteLink(subId, inviteLink, txClient = pool) {
    const query = "UPDATE subscriptions SET invite_link_url = $1 WHERE id = $2";
    await txClient.query(query, [inviteLink, subId]);
  }

  async findAllCurrencies() {
    const query =
      "SELECT id, code, name FROM dictionary_currencies ORDER BY id;";
    const result = await pool.query(query);
    return result.rows;
  }

  async findCurrencyByCode(code) {
    const query =
      "SELECT id, code, name FROM dictionary_currencies WHERE code = $1;";
    const { rows } = await pool.query(query, [code]);
    return rows[0];
  }

  async findStarsPaymentCheck(invoicePayload) {
    const query = `
      SELECT p.id as payment_db_id, p.amount as total_stars_paid, p.channel_id, p.subscription_id,
             s.status as sub_status, s.expires_at as sub_current_expires, c.title as channel_title
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      JOIN channels c ON p.channel_id = c.id
      WHERE p.gateway_invoice_id = $1;
    `;
    const res = await pool.query(query, [invoicePayload]);
    return res.rows[0] || null;
  }

  async findTariffDetailsBySubId(subscriptionId) {
    const query = `
      SELECT t.duration_days, c.tg_channel_id 
      FROM subscriptions s
      JOIN tariffs t ON s.tariff_id = t.id
      JOIN channels c ON s.channel_id = c.id
      WHERE s.id = $1;
    `;
    const res = await pool.query(query, [subscriptionId]);
    return res.rows[0] || null;
  }

  async confirmStarsPayment(
    paymentDbId,
    chargeId,
    availableAt,
    txClient = pool,
  ) {
    const query = `
      UPDATE payments 
      SET status = 'hold', 
          telegram_payment_charge_id = $1,
          available_at = $2 
      WHERE id = $3;
    `;
    await txClient.query(query, [chargeId, availableAt, paymentDbId]);
  }

  async updateSubscriptionPeriod(
    subscriptionId,
    nextStatus,
    newExpiresAt,
    txClient = pool,
  ) {
    const query = `
      UPDATE subscriptions 
      SET status = $1, expires_at = $2, expires_reminded_3d = FALSE 
      WHERE id = $3;
    `;
    await txClient.query(query, [nextStatus, newExpiresAt, subscriptionId]);
  }

  async getTransactions(channelId, limit = 10) {
    const query = `
  SELECT 
    p.id,
    p.amount,
    p.net_amount,
    p.customer_comment,
    p.status,
    TO_CHAR(p.created_at, 'DD.MM.YYYY HH24:MI') as created_at,
    
    COALESCE(ps.type, 'deposit') as type, 
    
    u.username as user_username,
    u.first_name as user_first_name,
    
    COALESCE(ps.title, 'Прямой донат / Оплата') as service_name,
    dc.code as currency_code
  FROM payments p
  LEFT JOIN users u ON p.user_tg_id = u.tg_id
  LEFT JOIN platform_services ps ON p.service_id = ps.id
  LEFT JOIN dictionary_currencies dc ON p.currency_id = dc.id
  WHERE p.channel_id = $1 AND p.status = 'success'
  ORDER BY p.id DESC
  LIMIT $2;
`;

    try {
      const { rows } = await pool.query(query, [channelId, limit]);
      return rows;
    } catch (error) {
      console.error("Ошибка в paymentRepository.getTransactions:", error);
      throw error;
    }
  }
}

export const paymentRepository = new PaymentRepository();
