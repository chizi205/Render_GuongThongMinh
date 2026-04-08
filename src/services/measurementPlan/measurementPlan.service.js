const planRepo = require("../../repositories/measurementPlan/measurementPlan.repo");

const getPlans = async ({ staff }) => {
  if (!staff || !staff.shop_id) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }

  const plans = await planRepo.getPlansByShop({
    shop_id: staff.shop_id,
  });

  return plans;
};

module.exports = {
  getPlans,
};