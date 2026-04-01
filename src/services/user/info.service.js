const repo = require("../../repositories/user/info.repo");

const getProfile = async (user_id) => {

  const user = await repo.findUserById(user_id);

  if (!user) {
    const err = new Error("USER_NOT_FOUND");
    err.status = 404;
    throw err;
  }

  return {
    id: user.id,
    phone: user.phone,
    full_name: user.full_name,
    gender: user.gender,
    email:user.email,
    avatar_url: user.avatar_url,
    zalo_user_id: user.zalo_user_id
  };
};
const getPhotoHistory = async ({ user_id, cursor = null, limit = 10 }) => {

  const safeLimit = Math.min(Number(limit) || 10, 50);

  const result = await repo.getPhotoHistory({
    user_id,
    cursor,
    limit: safeLimit
  });

  return result;
};
module.exports={
    getProfile,
    getPhotoHistory
}
