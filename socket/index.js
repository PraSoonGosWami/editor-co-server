const socketIo = require("socket.io");
const { saveDocumentById } = require("../controllers/document-controllers");

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

  const userData = {};

  io.on("connection", (socket) => {
    socket.on("join-room", ({ docId, userId }) => {
      socket.join(docId);
      userData[docId] = {};
      userData[docId][socket.id] = userId;
      socket.on("send-changes", (delta) => {
        socket.broadcast.to(docId).emit("receive-changes", delta);
      });
      socket.on("update-cursor", (cursorData) => {
        socket.broadcast.to(docId).emit("receive-cursor", cursorData);
      });
      socket.on("save-document", async (payload) => {
        const message = await saveDocumentById({ docId, ...payload });
        socket.emit("save-document-response", message);
      });
      socket.on("disconnect", () => {
        delete userData[docId][socket.id];
      });
    });
  });
};

module.exports = ServerSocket;
