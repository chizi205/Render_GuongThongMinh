const { Server } = require("socket.io");
const EVENTS = require("./events");
const registerHandlers = require("./handlers");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on(EVENTS.CONNECTION, (socket) => {
    console.log("Socket connected:", socket.id);

    registerHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("SOCKET_NOT_INITIALIZED");
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};