const pool = require("../../config/database");

class DashboardRepository {
  async getSummary() {
    const queries = {
      totalProducts: "SELECT COUNT(*) FROM products",
      needVariants: `
        SELECT COUNT(*) FROM products p 
        LEFT JOIN product_variants pv ON p.id = pv.product_id 
        WHERE pv.id IS NULL`,
      totalKiosks: "SELECT COUNT(*) FROM kiosks",
      kiosksOnline: "SELECT COUNT(*) FROM kiosks WHERE status = 'online'",
      totalUsers: "SELECT COUNT(*) FROM users",
      recentActivities: `
        SELECT 
            t.tried_at as created_at, 
            COALESCE(u.full_name, 'Khách vãng lai') as user, 
            p.name as target, 
            'đã thử đồ' as action
        FROM try_ons t
        JOIN product_variants pv ON t.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        LEFT JOIN kiosk_sessions ks ON t.kiosk_session_id = ks.id
        LEFT JOIN users u ON ks.user_id = u.id
        ORDER BY t.tried_at DESC 
        LIMIT 10`
    };

    try {
      const [products, variants, kiosks, online, users, activities] = await Promise.all([
        pool.query(queries.totalProducts),
        pool.query(queries.needVariants),
        pool.query(queries.totalKiosks),
        pool.query(queries.kiosksOnline),
        pool.query(queries.totalUsers),
        pool.query(queries.recentActivities)
      ]);

      return {
        total_products: parseInt(products.rows[0].count),
        need_variants: parseInt(variants.rows[0].count),
        total_kiosks: parseInt(kiosks.rows[0].count),
        kiosks_online: parseInt(online.rows[0].count),
        total_users: parseInt(users.rows[0].count),
        recent_activities: activities.rows
      };
    } catch (error) {
      console.error("DashboardRepository Error:", error);
      throw error;
    }
  }
}

module.exports = new DashboardRepository();