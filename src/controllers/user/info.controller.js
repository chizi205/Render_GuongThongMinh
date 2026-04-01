const service = require("../../services/user/info.service");
const {
  ok,
  serverError,
} = require("../../utils/response");
const getProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const user = await service.getProfile(user_id);

    return ok(res, 200, {
      message: "GET_PROFILE_SUCCESS",
      data: user
    });

  } catch (err) {
    return serverError(res, err.message);
  }
};
const getPhotoHistory = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const { cursor = null, limit = 10 } = req.query;

    const data = await service.getPhotoHistory({
      user_id,
      cursor,
      limit: Number(limit)
    });

    return res.json({
      success: true,
      data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
module.exports={
    getProfile,
    getPhotoHistory
}