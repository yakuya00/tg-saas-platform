import pool from "../config/db.js";

class CustomerRepository {
  async insert(channelId, userId, amount, txClient = pool) {
    const query = `
    INSERT INTO channel_customers 
      (channel_id, user_tg_id, total_paid_usdt, payments_count, first_sub_at, last_activity_at, is_currently_active)
    VALUES 
      ($1, $2, $3, 1, NOW(), NOW(), true)
    ON CONFLICT (channel_id, user_tg_id) 
    DO UPDATE SET 
      total_paid_usdt = channel_customers.total_paid_usdt + EXCLUDED.total_paid_usdt,
      payments_count = channel_customers.payments_count + 1,
      last_activity_at = NOW(),
      is_currently_active = true
    RETURNING *;
  `;
    const { rows } = await txClient.query(query, [channelId, userId, amount]);
    return rows[0];
  }

  async updateCustomerActivity(channelId, userId, isActive, txClient = pool) {
    const userTgId = String(userId);

    const query = `
    UPDATE channel_customers
    SET 
      is_currently_active = $3,
      last_activity_at = NOW()
    WHERE channel_id = $1 AND user_tg_id = $2
    RETURNING *;
  `;

    const res = await txClient.query(query, [channelId, userTgId, isActive]);
    return res.rows[0];
  }

  async deleteCustomer(channelId, userTgId, txClient = pool) {
    if (!channelId || !userTgId) {
      throw new Error(
        "⛔ [REPOSITORY ERROR] Не переданы channelId или userTgId для удаления клиента",
      );
    }

    const queryText = `
      DELETE FROM channel_customers 
      WHERE channel_id = $1 AND user_tg_id = $2
      RETURNING id;
    `;

    try {
      const { rows } = await txClient.query(queryText, [channelId, userTgId]);

      if (rows.length === 0) {
        console.warn(
          `⚠️ [REPOSITORY] Запись в customers для канала #${channelId} и юзера ${userTgId} не найдена. Возможно, уже удален.`,
        );
        return false;
      }

      console.log(
        `🗑️ [DB CUSTOMER DELETE] Юзер ${userTgId} успешно удален из клиентов канала #${channelId}.`,
      );
      return true;
    } catch (error) {
      console.error(
        `❌ [DB ERROR] Крах при выполнении deleteCustomer для юзера ${userTgId}:`,
        error.message,
      );
      throw error;
    }
  }

  async isFirstTimeCustomer(channelId, userTgId, txClient) {
    const query = `
    SELECT EXISTS(
      SELECT 1 FROM channel_customers 
      WHERE channel_id = $1 AND user_tg_id = $2
    );
  `;
    const res = await txClient.query(query, [channelId, userTgId]);
    return !res.rows[0].exists;
  }
}

export const customerRepository = new CustomerRepository();
