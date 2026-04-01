// src/repositories/shop.repository.js
const pool = require("../../config/database");

class ShopRepository {
  static async findById(id) {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM shops
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1
      `,
      [id],
    );

    return rows[0] || null;
  }

  // 🔹 Lấy shop theo zalo_oa_id
  static async findByZaloOAId(zaloOaId) {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM shops
      WHERE zalo_oa_id = $1 AND deleted_at IS NULL
      LIMIT 1
      `,
      [zaloOaId],
    );

    return rows[0] || null;
  }

  // 🔹 Tạo shop
  static async create(data) {
    const tokenExpiry = new Date(Date.now() + data.token_expiry * 1000);
    const { rows } = await pool.query(
      `
      INSERT INTO shops (
        name, slug, zalo_oa_id,
        zalo_access_token, zalo_refresh_token, token_expiry,
        logo_url, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        data.name,
        data.slug,
        data.zalo_oa_id ?? null,
        data.zalo_access_token ?? null,
        data.zalo_refresh_token ?? null,
        tokenExpiry ?? null,
        data.logo_url ?? null,
        data.status ?? "active",
      ],
    );

    return rows[0];
  }

  // 🔹 Update token Zalo (chuẩn hơn)
  static async updateZaloToken(
    shopId,
    { accessToken, refreshToken, expiresIn },
  ) {
    const expires = Number(expiresIn);

    if (!expires || isNaN(expires)) {
      console.error("Invalid expiresIn:", expiresIn);
      throw new Error("INVALID_EXPIRES_IN");
    }

    const tokenExpiry = new Date(Date.now() + expires * 1000);

    const { rows } = await pool.query(
      `
    UPDATE shops
    SET 
      zalo_access_token = $1,
      zalo_refresh_token = $2,
      token_expiry = $3,
      updated_at = NOW()
    WHERE id = $4
    RETURNING *
    `,
      [accessToken, refreshToken, tokenExpiry, shopId],
    );

    return rows[0] || null;
  }
  
  static async isTokenExpired(shopId) {
    const { rows } = await pool.query(
      `
      SELECT token_expiry
      FROM shops
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [shopId],
    );

    const expiry = rows[0]?.token_expiry;

    if (!expiry) return true;

    // 🔥 trừ 5 phút để refresh sớm
    const bufferTime = 5 * 60 * 1000;

    return Date.now() >= new Date(expiry).getTime() - bufferTime;
  }

  // 🔹 Lấy token + expiry (dùng cho service)
  static async getTokenInfo(shopId) {
    const { rows } = await pool.query(
      `
      SELECT 
        zalo_oa_id,
        zalo_access_token,
        zalo_refresh_token,
        token_expiry,
        zalo_secret_key 
      FROM shops
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [shopId],
    );

    return rows[0] || null;
  }

  static async softDelete(id) {
    await pool.query(
      `
      UPDATE shops
      SET deleted_at = NOW()
      WHERE id = $1
      `,
      [id],
    );

    return true;
  }
}

module.exports = ShopRepository;
