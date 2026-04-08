const service = require("../../services/measurementPlan/planDetail.repository");

const getCustomers = async (req, res) => {
  try {
    const { plan_id } = req.params;

    const data = await service.getCustomers({
      plan_id,
      staff: req.staff,
    });

    return res.json({
      success: true,
      data,
    });

  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getCustomers,
};