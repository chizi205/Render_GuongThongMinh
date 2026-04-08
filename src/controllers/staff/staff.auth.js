const staffService = require("../../services/staff/auth.service");

const login = async (req, res) => {
  try {
    const { phone, password, session_id } = req.body;

    const result = await staffService.loginStaff({
      phone,
      password,
      session_id,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Staff login error:", err);

    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "INTERNAL_SERVER_ERROR",
    });
  }
};

module.exports = {
  login,
};
