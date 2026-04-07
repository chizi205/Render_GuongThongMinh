const kioskService = require("../../services/admin/kiosk.service");

// 1. Lấy danh sách & Phân trang, Tìm kiếm, Lọc
const getKiosks = async (req, res) => {
  try {
    const data = await kioskService.getAllKiosks(req.query);
    // Trả về trực tiếp object { items, total, summary }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi getKiosks:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tải danh sách Kiosk" });
  }
};

// 2. Chi tiết 1 Kiosk
const getKioskById = async (req, res) => {
  try {
    const kiosk = await kioskService.getKioskById(req.params.id);
    if (!kiosk) return res.status(404).json({ message: "Không tìm thấy Kiosk" });
    
    return res.status(200).json(kiosk);
  } catch (error) {
    console.error("Lỗi getKioskById:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 3. Thêm mới
const createKiosk = async (req, res) => {
  try {
    const newKiosk = await kioskService.createKiosk(req.body);
    return res.status(201).json(newKiosk);
  } catch (error) {
    console.error("Lỗi createKiosk:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo Kiosk" });
  }
};

// 4. Cập nhật
const updateKiosk = async (req, res) => {
  try {
    const updatedKiosk = await kioskService.updateKiosk(req.params.id, req.body);
    if (!updatedKiosk) return res.status(404).json({ message: "Không tìm thấy Kiosk" });
    
    return res.status(200).json(updatedKiosk);
  } catch (error) {
    console.error("Lỗi updateKiosk:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật" });
  }
};

// 5. Xóa
const deleteKiosk = async (req, res) => {
  try {
    const isDeleted = await kioskService.deleteKiosk(req.params.id);
    if (!isDeleted) return res.status(404).json({ message: "Không tìm thấy Kiosk để xóa" });
    
    return res.status(200).json({ message: "Đã xóa Kiosk thành công" });
  } catch (error) {
    console.error("Lỗi deleteKiosk:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa Kiosk" });
  }
};

module.exports = {
  getKiosks,
  getKioskById,
  createKiosk,
  updateKiosk,
  deleteKiosk
};