const socketIo = require("socket.io");
const {
  saveDocument,
  getDocument,
} = require("../controllers/document-controllers");

/**
 *
 * @param server - http server
 * All server side socket related logic
 */
const ServerSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origins: [
        "https://editor-co.web.app",
        "https://editor-co.firebaseapp.com",
        "http://localhost:3000",
      ],
      method: ["GET", "POST"],
    },
  });

  const documents = {};

  io.on("connection", (socket) => {
    socket.on("join-room", async ({ docId, userId }) => {
      socket.join(docId);
      if (!documents[docId]) {
        const data = await getDocument({ docId, userId });
        documents[docId] = data;
      }

      socket.emit("load-document", documents[docId]["data"]);

      socket.on("send-changes", (delta) => {
        socket.broadcast.to(docId).emit("receive-changes", delta);
      });
      socket.on("update-cursor", (cursorData) => {
        socket.broadcast.to(docId).emit("receive-cursor", cursorData);
      });
      socket.on("save-document", (payload) => {
        documents[docId] = { ...payload };
      });
      socket.on("disconnect", async () => {
        const message = await saveDocument({ docId, ...documents[docId] });
        socket.emit("save-document-response", message);
        const room = io.sockets.adapter.rooms.get(docId);
        if (room === undefined) delete documents[docId];
      });
    });
  });
};

module.exports = ServerSocket;
