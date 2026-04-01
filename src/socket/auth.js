/**
 * Xác thực socket.
 * Tuỳ bạn: dùng token kiosk/shop/admin khác nhau.
 * Hiện tại để mở (cho dev). Khi làm thật, kiểm token ở đây.
 */
module.exports = function authSocket(socket, next) {
  // const token = socket.handshake.auth?.token;
  // verify token...
  return next();
};
