const planService = require("../../services/measurementPlan/measurementPlan.service");

const getPlans = async (req, res) => {
  try {
    const plans = await planService.getPlans({
      staff: req.staff,
    });

    return res.json({
      success: true,
      data: plans,
    });

  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getPlans,
};