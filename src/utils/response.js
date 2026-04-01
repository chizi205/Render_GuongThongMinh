const ok = (res, status, payload = {}) => res.status(status).json({ success: true, ...payload });

const badRequest = (res, message, extra = {}) =>
  res.status(400).json({ success: false, message, ...extra });

const unauthorized = (res, message, extra = {}) =>
  res.status(401).json({ success: false, message, ...extra });

const notFound = (res, message, extra = {}) =>
  res.status(404).json({ success: false, message, ...extra });

const conflict = (res, message, extra = {}) =>
  res.status(409).json({ success: false, message, ...extra });

const serverError = (res, message = "Server error") =>
  res.status(500).json({ success: false, message });

module.exports = {
  ok,
  badRequest,
  unauthorized,
  notFound,
  conflict,
  serverError,
};
