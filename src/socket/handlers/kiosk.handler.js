const EVENTS = require("../events");
const { sessionRoom } = require("../rooms");

module.exports = (io, socket) => {
  socket.on(EVENTS.JOIN_SESSION, (session_id) => {
    if (!session_id) return;

    socket.join(sessionRoom(session_id));
    console.log(`Socket ${socket.id} joined ${sessionRoom(session_id)}`);
  });
};