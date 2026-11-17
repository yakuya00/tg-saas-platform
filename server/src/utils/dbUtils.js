import pool from "../config/db.js";

/**
 * Spustí callback funkci v rámci izolované SQL transakce (ACID).
 * @function runTransaction
 * @param {Function} callback - Asynchronní funkce přijímající transakčního klienta.
 * @returns {Promise<any>} Výsledek callbacku.
 * @throws {Error} Pokud transakce selže, provede se ROLLBACK.
 */
export const runTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
