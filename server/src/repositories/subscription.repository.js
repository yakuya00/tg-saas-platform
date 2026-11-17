import pool from "../config/db.js";

class SubscriptionRepository {
  async findActiveSubscription(userTgId, serviceId) {
    const query = `
      SELECT id FROM subscriptions 
      WHERE user_tg_id = $1 AND service_id = $2 AND status IN ('active', 'pending_join')
      ORDER BY expires_at DESC LIMIT 1;
    `;
    const res = await pool.query(query, [userTgId, serviceId]);
    return res.rows[0]?.id || null;
  }

  async findActiveSubscriptionByChannel(userTgId, channelId) {
    const query = `
    SELECT s.id 
    FROM subscriptions s
    INNER JOIN platform_services ps ON s.service_id = ps.id
    WHERE s.user_tg_id = $1 
      AND ps.channel_id = $2 
      AND s.status IN ('active', 'pending_join')
    ORDER BY s.expires_at DESC 
    LIMIT 1;
  `;
    const res = await pool.query(query, [userTgId.toString(), channelId]);

    return res.rows[0]?.id || null;
  }

  async createDraftSubscription(userTgId, serviceId) {
    const query = `
      INSERT INTO subscriptions (user_tg_id, service_id, status, expires_at)
      VALUES ($1, $2, 'expired', NOW())
      RETURNING id;
    `;
    const res = await pool.query(query, [userTgId, serviceId]);
    return res.rows[0].id;
  }

  async activateSubscriptionByLink(
    realUserTgId,
    processedLink,
    txClient = pool,
  ) {
    const query = `
    UPDATE subscriptions s
    SET 
      user_tg_id = $1, 
      status = 'active'
    WHERE s.invite_link_url LIKE $2 || '%' 
      AND s.status IN ('pending_join', 'active')
    RETURNING s.id;
  `;

    const res = await txClient.query(query, [
      String(realUserTgId),
      processedLink,
    ]);

    return res.rows[0] || null;
  }

  async updateSubscriptionDetails(
    subId,
    status,
    expiresAt,
    serviceId,
    txClient = pool,
  ) {
    const query = `
      UPDATE subscriptions 
      SET status = $1, expires_at = $2, service_id = $3, reminded_3d = FALSE 
      WHERE id = $4
    `;
    await txClient.query(query, [status, expiresAt, serviceId, subId]);
  }

  async updateSubscriptionStatus(subId, status, txClient = pool) {
    if (!subId || !status) {
      throw new Error(
        "⛔ [REPOSITORY ERROR] Не переданы subId или status для обновления статуса подписки",
      );
    }

    const query = `
      UPDATE subscriptions 
      SET 
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING id, status;
    `;

    try {
      const { rows } = await txClient.query(query, [status, subId]);
      return rows[0];
    } catch (error) {
      console.error(
        `❌ [DB ERROR] Крах при выполнении updateSubscriptionStatus для подписки #${subId}:`,
        error.message,
      );
      throw error;
    }
  }

  async getExpiredSubscriptions(txClient = pool) {
    const query = `
    SELECT 
      s.id as sub_id, 
      s.user_tg_id, 
      c.id as channel_id,
      c.tg_channel_id, 
      c.title as channel_title,
      c.admin_tg_id as admin_id
    FROM subscriptions s
    JOIN platform_services ps ON s.service_id = ps.id
    JOIN channels c ON ps.channel_id = c.id
    WHERE s.status = 'active' 
      AND s.expires_at <= NOW()
    ORDER BY s.expires_at ASC
    LIMIT 100
    FOR UPDATE SKIP LOCKED;
  `;
    const res = await txClient.query(query);
    return res.rows;
  }

  async updateStatusToExpired(subId, txClient = pool) {
    const query = `UPDATE subscriptions SET status = 'expired' WHERE id = $1;`;
    await txClient.query(query, [subId]);
  }

  async getSubscriptionsForReminder() {
    const query = `
      SELECT s.id as sub_id, s.user_tg_id, c.id as channel_id, c.title as channel_title, s.expires_at
      FROM subscriptions s
      JOIN channels c ON s.channel_id = c.id
      WHERE s.status = 'active' 
        AND s.expires_reminded_3d = FALSE
        AND s.expires_at::date <= (NOW() + INTERVAL '3 days')::date;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  async setReminderFlagTrue(subId) {
    const query = `UPDATE subscriptions SET expires_reminded_3d = TRUE WHERE id = $1;`;
    await pool.query(query, [subId]);
  }
}

export const subscriptionRepository = new SubscriptionRepository();
