const kioskHandler = require("./kiosk.handler");
const adminHandler = require("./admin.handler");
const shopHandler = require("./shop.handler");

module.exports = (io, socket) => {
  kioskHandler(io, socket);
  adminHandler(io, socket);
  shopHandler(io, socket);
};