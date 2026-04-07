const kioskRepository = require("../../repositories/admin/kiosk.repository");
const bcrypt = require("bcrypt"); // Nhớ npm install bcrypt nếu chưa có

class KioskService {
  async getAllKiosks(query) {
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const offset = (page - 1) * limit;

    return await kioskRepository.getAll({
      search: query.search,
      shop_id: query.shop_id,
      status: query.status,
      limit,
      offset
    });
  }

  async getKioskById(id) {
    return await kioskRepository.getById(id);
  }

  async createKiosk(data) {
    // Tạo mật khẩu mặc định là "123456" nếu người dùng không nhập
    const rawPassword = data.password || "123456";
    const password_hash = await bcrypt.hash(rawPassword, 10);
    
    return await kioskRepository.create({ ...data, password_hash });
  }

  async updateKiosk(id, data) {
    return await kioskRepository.update(id, data);
  }

  async deleteKiosk(id) {
    return await kioskRepository.delete(id);
  }
}

module.exports = new KioskService();