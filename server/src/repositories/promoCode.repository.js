import pool from "../config/db.js";

class PromoCodeRepository {
  async getCouponsByChannel(channelId) {
    const query = `
      SELECT 
        id,
        code,
        discount_type,
        discount_value,
        usage_limit,
        used_count,
        is_active,
        CASE 
          WHEN expires_at IS NOT NULL THEN TO_CHAR(expires_at, 'DD.MM.YYYY')
          ELSE NULL
        END as expire_date
      FROM promo_codes
      WHERE channel_id = $1
      ORDER BY id DESC;
    `;

    const { rows } = await pool.query(query, [channelId]);
    return rows;
  }

  async createCoupon(channelId, couponData) {
    const { code, discount_type, discount_value, usage_limit, expires_at } =
      couponData;
    const query = `
      INSERT INTO promo_codes 
        (channel_id, code, discount_type, discount_value, usage_limit, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      channelId,
      code.toUpperCase().trim(),
      discount_type,
      discount_value,
      usage_limit || null,
      expires_at || null,
    ]);
    return rows[0];
  }
}

export const promoCodeRepository = new PromoCodeRepository();
