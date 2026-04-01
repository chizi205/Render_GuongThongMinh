const http = require("http");
const app = require("./src/app");
const { initSocket } = require("./src/socket");

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
