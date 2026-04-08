const db = require("../../config/database");

// lấy danh sách kế hoạch theo shop
const getPlansByShop = async ({ shop_id }) => {
  const result = await db.query(
    `
    SELECT 
      mp.id,
      mp.name,
      mp.note,
      mp.status,
      mp.created_at,
      s.username AS created_by_name,
      is_synced
    FROM measurement_plans mp
    LEFT JOIN shop_staffs s ON mp.created_by = s.id
    WHERE mp.shop_id = $1
      AND mp.is_deleted = FALSE
    ORDER BY mp.created_at DESC
    `,
    [shop_id],
  );

  return result.rows;
};

const getCustomersByPlan = async ({ plan_id }) => {
  const result = await db.query(
    `
    SELECT 
      pd.id AS plan_detail_id,
      c.id AS customer_id,
      c.name,
      c.phone,
      pd.status,
      pd.created_at
    FROM plan_details pd
    JOIN customers c ON pd.customer_id = c.id
    WHERE pd.plan_id = $1
      AND pd.is_deleted = FALSE
    ORDER BY pd.created_at DESC
    `,
    [plan_id],
  );

  return result.rows;
};

module.exports = {
  getPlansByShop,
  getCustomersByPlan
};
