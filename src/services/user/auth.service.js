const bcrypt = require("bcryptjs");
const jwt = require("../../utils/jwt");
const repo = require("../../repositories/user/auth.repo");
const session = require("../../repositories/kiosk/session.repo");
const { getIO } = require("../../socket");
const EVENTS = require("../../socket/events");
const { sessionRoom } = require("../../socket/rooms");

const ALLOWED_GENDERS = ["male", "female", "other"];

const emitUserIdentified = ({ session_id, access_token }) => {
  if (!session_id) return;

  const io = getIO();
  io.to(sessionRoom(session_id)).emit(EVENTS.USER_IDENTIFIED, {
    session_id,
    access_token
  });
};

const register = async ({
  full_name,
  phone,
  gender,
  password,
  email,
  address,
  session_id = null,
}) => {
  if (!full_name || !phone || !password) {
    const err = new Error("MISSING_REQUIRED_FIELDS");
    err.status = 400;
    throw err;
  }

  const normalizedName = String(full_name).trim();
  const normalizedPhone = String(phone).trim();
  const normalizedGender = gender ? String(gender).trim().toLowerCase() : null;
  const normalizedEmail = email ? String(email).trim() : null;
  const normalizedAddress = address ? String(address).trim() : null;
  const rawPassword = String(password);

  if (normalizedName.length < 2) {
    const err = new Error("INVALID_FULL_NAME");
    err.status = 400;
    throw err;
  }

  const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
  if (!phoneRegex.test(normalizedPhone)) {
    const err = new Error("INVALID_PHONE");
    err.status = 400;
    throw err;
  }

  if (normalizedGender && !ALLOWED_GENDERS.includes(normalizedGender)) {
    const err = new Error("INVALID_GENDER");
    err.status = 400;
    err.extra = { allowed_genders: ALLOWED_GENDERS };
    throw err;
  }

  if (rawPassword.length < 6) {
    const err = new Error("PASSWORD_TOO_SHORT");
    err.status = 400;
    throw err;
  }

  const existed = await repo.findUserByPhone(normalizedPhone);
  if (existed) {
    const err = new Error("PHONE_ALREADY_EXISTS");
    err.status = 400;
    throw err;
  }

  const password_hash = await bcrypt.hash(rawPassword, 10);

  const user = await repo.createUser({
  phone: normalizedPhone,
  full_name: normalizedName,
  gender: normalizedGender,
  email: normalizedEmail,
  address: normalizedAddress,
  password_hash,
});

  await session.updateUserIdBySessionId({
    session_id: session_id,
    user_id: user.id,
  });

  const access_token = jwt.createAccessToken({
    type: "user",
    user_id: user.id,
    phone: user.phone,
    role: "user",
  });

  const refresh_token = jwt.createRefreshToken({
    type: "user",
    user_id: user.id,
    phone: user.phone,
    role: "user",
  });

  emitUserIdentified({ session_id, access_token });

  return {
    user: {
      id: user.id,
      phone: user.phone,
      full_name: user.full_name,
      gender: user.gender,
      avatar_url: user.avatar_url,
      zalo_user_id: user.zalo_user_id,
      is_active: user.is_active,
    },
    access_token,
    refresh_token,
  };
};

const login = async ({ phone, password, session_id = null }) => {
  if (!phone || !password) {
    const err = new Error("MISSING_CREDENTIALS");
    err.status = 400;
    throw err;
  }

  const normalizedPhone = String(phone).trim();
  const rawPassword = String(password);

  const user = await repo.findUserByPhone(normalizedPhone);
  if (!user) {
    const err = new Error("INVALID_CREDENTIALS");
    err.status = 401;
    throw err;
  }

  if (!user.is_active) {
    const err = new Error("USER_DISABLED");
    err.status = 403;
    throw err;
  }

  if (!user.password_hash) {
    const err = new Error("USER_HAS_NO_PASSWORD");
    err.status = 400;
    throw err;
  }

  const matched = await bcrypt.compare(rawPassword, user.password_hash);
  if (!matched) {
    const err = new Error("INVALID_CREDENTIALS");
    err.status = 401;
    throw err;
  }

  await session.updateUserIdBySessionId({
    session_id: session_id,
    user_id: user.id,
  });
  const access_token = jwt.createAccessToken({
    type: "user",
    user_id: user.id,
    phone: user.phone,
    role: "user",
  });

  const refresh_token = jwt.createRefreshToken({
    type: "user",
    user_id: user.id,
    phone: user.phone,
    role: "user",
  });

  emitUserIdentified({ session_id, access_token });

  return {
    user: {
      id: user.id,
      phone: user.phone,
      full_name: user.full_name,
      gender: user.gender,
      avatar_url: user.avatar_url,
      zalo_user_id: user.zalo_user_id,
      is_active: user.is_active,
    },
    access_token,
    refresh_token,
  };
};
const checkUserFollowOA = async ({ shopId, userId }) => {
  if (!shopId || !userId) {
    return false;
  }

  try {
    const isFollow = await repo.isUserFollowOA(shopId, userId);

    return Boolean(isFollow);
  } catch (err) {
    console.error("checkUserFollowOA error:", err);
    return false;
  }
};
module.exports = {
  register,
  login,
  checkUserFollowOA
};
