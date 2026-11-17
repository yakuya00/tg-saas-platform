import pool from "../config/db.js";

class GiveawayRepository {
  async getGiveawaysByChannel(channelId) {
    const query = `
      SELECT 
        g.id,
        g.title,
        g.winners_count,
        g.status,
        TO_CHAR(g.end_at, 'DD.MM.YYYY HH24:MI') as end_date,
        TO_CHAR(g.created_at, 'DD.MM.YYYY') as start_date,
        
        ps.title as service_name,
        ps.price as service_price
      FROM giveaways g
      LEFT JOIN platform_services ps ON g.service_id = ps.id
      WHERE g.channel_id = $1
      ORDER BY g.id DESC;
    `;

    try {
      const { rows } = await pool.query(query, [channelId]);
      return rows;
    } catch (error) {
      console.error(
        "Ошибка в giveawayRepository.getGiveawaysByChannel:",
        error,
      );
      throw error;
    }
  }

  async createGiveaway(channelId, giveawayData) {
    const { title, service_id, winners_count, duration_days } = giveawayData;

    const query = `
      INSERT INTO giveaways (
        channel_id, 
        service_id, 
        title, 
        winners_count, 
        end_at
      )
      VALUES ($1, $2, $3, $4, NOW() + ($5 || ' days')::INTERVAL)
      RETURNING *, TO_CHAR(NOW() + ($5 || ' days')::INTERVAL, 'DD.MM.YYYY HH24:MI') as end_date;
    `;

    try {
      const { rows } = await pool.query(query, [
        channelId,
        service_id,
        title.trim(),
        parseInt(winners_count) || 1,
        parseInt(duration_days) || 1,
      ]);
      return rows[0];
    } catch (error) {
      console.error("Ошибка в giveawayRepository.createGiveaway:", error);
      throw error;
    }
  }
}

export const giveawayRepository = new GiveawayRepository();
