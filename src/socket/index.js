const { Server } = require("socket.io");
const EVENTS = require("./events");
const registerHandlers = require("./handlers");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // hoặc thay bằng domain thật của bạn
      methods: ["GET", "POST"],
      credentials: true,
    },

    // ==================== CẤU HÌNH QUAN TRỌNG ĐỂ ƯU TIÊN WEBSOCKET ====================
    transports: ["websocket", "polling"], // ưu tiên WebSocket trước
    allowUpgrades: true,
    upgradeTimeout: 30000, // 30 giây để upgrade
    pingTimeout: 60000, // 60 giây
    pingInterval: 25000, // 25 giây
    maxHttpBufferSize: 1e8, // 100MB (phòng trường hợp gửi ảnh lớn)
    httpCompression: false, // tắt nén http (giảm lỗi proxy)
    perMessageDeflate: false, // tắt nén websocket (proxy hay block)

    // Tùy chọn thêm cho môi trường production
    connectTimeout: 45000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  io.on(EVENTS.CONNECTION, (socket) => {
    console.log(
      `🔌 Socket connected: ${socket.id} | Transport: ${socket.conn.transport.name}`,
    );

    registerHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });

    // Log transport khi upgrade thành công (để debug)
    socket.conn.on("upgrade", (transport) => {
      console.log(`🚀 Socket ${socket.id} upgraded to: ${transport.name}`);
    });
  });

  console.log("✅ Socket.io initialized with WebSocket priority");
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
