const categoryRepo = require("../../repositories/admin/category.repository");

const getAllCategories = async () => {
  return await categoryRepo.getAllCategories();
};

module.exports = {
  getAllCategories
};