const dashboardRepository = require("../../repositories/admin/dashboard.repository");

class DashboardService {
  async getDashboardData() {
    try {
      const data = await dashboardRepository.getSummary();
      // Bạn có thể xử lý thêm logic ở đây (VD: tính % tăng trưởng)
      return data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DashboardService();