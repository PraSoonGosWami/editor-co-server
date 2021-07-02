const socketIo = require("socket.io");

/**
 *
 * @param {*} server - http server
 * All server side socket related logic
 */
const ServerSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      method: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {});
};

module.exports = ServerSocket;
