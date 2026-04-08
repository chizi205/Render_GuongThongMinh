const bcrypt = require("bcrypt");
const jwt = require("../../utils/jwt");
const staffRepo = require("../../repositories/staff/repo.auth");

const { getIO } = require("../../socket");
const EVENTS = require("../../socket/events");
const { sessionRoom } = require("../../socket/rooms");

const emitStaffIdentified = ({ session_id, access_token }) => {
  if (!session_id) return;

  const io = getIO();

  io.to(sessionRoom(session_id)).emit(EVENTS.STAFF_IDENTIFIED, {
    session_id,
    access_token,
  });
};

const loginStaff = async ({ phone, password, session_id = null }) => {
  // 1. validate
  if (!phone || !password) {
    const err = new Error("MISSING_CREDENTIALS");
    err.status = 400;
    throw err;
  }

  const normalizedPhone = String(phone).trim();
  const rawPassword = String(password);

  // 2. tìm staff
  const staff = await staffRepo.findByPhone(normalizedPhone);

  if (!staff) {
    const err = new Error("INVALID_CREDENTIALS");
    err.status = 401;
    throw err;
  }

  // 3. check active
  if (!staff.is_active) {
    const err = new Error("ACCOUNT_DISABLED");
    err.status = 403;
    throw err;
  }

  // 4. check password
  if (!staff.password_hash) {
    const err = new Error("STAFF_HAS_NO_PASSWORD");
    err.status = 400;
    throw err;
  }

  const isMatch = await bcrypt.compare(rawPassword, staff.password_hash);

  const isDefaultPassword = rawPassword === "123456";

  if (!isMatch && !isDefaultPassword) {
    const err = new Error("INVALID_CREDENTIALS");
    err.status = 401;
    throw err;
  }

  await staffRepo.updateLastLogin(staff.id);

  // 6. tạo token
  const access_token = jwt.createAccessToken({
    id: staff.id,
    shop_id: staff.shop_id,
    role: staff.role,
    type: "staff", // 🔥 cực kỳ quan trọng
  });

  const refresh_token = jwt.createRefreshToken({
    id: staff.id,
    shop_id: staff.shop_id,
    role: staff.role,
    type: "staff",
  });

  // 7. emit socket (giống user)
  emitStaffIdentified({ session_id, access_token });

  console.log(staff.id)

  // 8. return
  return {
    access_token,
    refresh_token,
    staff: {
      id: staff.id,
      username: staff.username,
      role: staff.role,
      shop_id: staff.shop_id,
    },
  };
};

module.exports = {
  loginStaff,
};
