import pool from "../config/db.js";

class UserRepository {
  async upsertUser({
    tg_id,
    username,
    first_name,
    language_code,
    referrer_id = null,
  }) {
    const query = `
            INSERT INTO users (tg_id, username, first_name, language_code, referrer_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (tg_id) 
            DO UPDATE SET 
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name,
                language_code = EXCLUDED.language_code
            RETURNING *;
        `;
    const values = [tg_id, username, first_name, language_code, referrer_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async findById(tgUserId) {
    const query = `SELECT * FROM users WHERE tg_id = $1`;
    const { rows } = await pool.query(query, [tgUserId]);
    return rows[0];
  }

  async updateBalanceByUserId(userId, adminShare, txClient = pool) {
    const query = `UPDATE users SET balance_available = balance_available + $1 WHERE tg_id = $2;`;
    await txClient.query(query, [adminShare, userId]);
  }

  async updateHoldBalanceByUserId(userId, adminShare, txClient = pool) {
    const query = `UPDATE users SET balance_hold = balance_hold + $1 WHERE tg_id = $2;`;
    await txClient.query(query, [adminShare, userId]);
  }

  async deductBalanceByUserId(userId, amount, txClient = pool) {
    if (!userId || amount === undefined || amount === null) {
      throw new Error(
        "⛔ [REPOSITORY ERROR] Не переданы userId или amount для списания баланса",
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      throw new Error(
        `⛔ [REPOSITORY ERROR] Некорректная сумма для списания баланса: ${amount}`,
      );
    }
    const queryText = `
      UPDATE users 
      SET 
        balance_available = balance_available - $1
      WHERE tg_id = $2
      RETURNING tg_id, balance_available;
    `;

    try {
      const { rows } = await txClient.query(queryText, [numericAmount, userId]);

      if (rows.length === 0) {
        console.warn(
          `⚠️ [REPOSITORY] Администратор с ID ${userId} не найден для списания баланса на -$${numericAmount}`,
        );
        return null;
      }

      console.log(
        `📉 [DB BALANCE UPDATE] Баланс пользователя #${userId} уменьшен на -$${numericAmount}. Текущий баланс: $${rows[0].balance_available}`,
      );
      return rows[0];
    } catch (error) {
      console.error(
        `❌ [DB ERROR] Крах при выполнении deductBalanceByUserId для юзера #${userId}:`,
        error.message,
      );
      throw error;
    }
  }
}

export const userRepository = new UserRepository();
