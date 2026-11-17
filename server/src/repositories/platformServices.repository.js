import pool from "../config/db.js";

class PlatformServicesRepository {
  async insert(channelId, serviceData) {
    const { type, title, price, durationDays, description } = serviceData;
    console.log(price);
    const query = `
      INSERT INTO platform_services (
        channel_id, 
        type, 
        title, 
        price, 
        duration_days
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    //const contentData = JSON.stringify({ description: description || "" });

    const { rows } = await pool.query(query, [
      channelId,
      type,
      title,
      price,
      durationDays,
      //contentData,
    ]);
    return rows[0];
  }

  async findActiveServicesByChannelId(channelId, type = null) {
    const queryParams = [channelId];

    let query = `
    SELECT 
      ps.id, 
      ps.title, 
      ps.price,
      ps.type,
      ps.duration_days 
    FROM platform_services ps
    WHERE ps.channel_id = $1 
      AND ps.is_active = TRUE
  `;
    if (type) {
      queryParams.push(type);
      query += ` AND ps.type = $2`;
    }

    query += ` ORDER BY ps.type ASC;`;
    const { rows } = await pool.query(query, queryParams);
    return rows;
  }

  async findServiceWithDetails(serviceId) {
    const query = `
        SELECT ps.*, c.id as channel_db_id
        FROM platform_services ps
        JOIN channels c ON ps.channel_id = c.id
        WHERE ps.id = $1
            AND ps.is_active = TRUE`;
    const res = await pool.query(query, [serviceId]);
    return res.rows[0] || null;
  }
}

export const platformServicesRepository = new PlatformServicesRepository();
