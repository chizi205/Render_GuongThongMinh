const repo = require("../../repositories/measurementPlan/measurementPlan.repo");

const getCustomers = async ({ plan_id, staff }) => {
  if (!staff || !staff.shop_id) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }

  if (!plan_id) {
    const err = new Error("MISSING_PLAN_ID");
    err.status = 400;
    throw err;
  }

  const customers = await repo.getCustomersByPlan({ plan_id });

  return customers;
};

module.exports = {
  getCustomers,
};