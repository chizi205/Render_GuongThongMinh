const dashboardService = require("../../services/admin/dashboard.service");
const { success, error } = require("../../utils/response");

class DashboardController {
  async getDashboard(req, res, next) {
    try {
      const data = await dashboardService.getDashboardData();
      return res.status(200).json({
        success: true,
        message: "Lấy dữ liệu Dashboard thành công",
        data: data
      });
    } catch (err) {
      console.error("DashboardController Error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy dữ liệu Dashboard"
      });
    }
  }
}

module.exports = new DashboardController();