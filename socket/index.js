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
  const users = {};

  io.on("connection", (socket) => {
    socket.on("join-room", async ({ docId, userId, name, avatar }) => {
      //joining the room
      socket.join(docId);
      //check if document with docId already presenet in memory
      //if not load it from database
      if (!documents[docId]) {
        const data = await getDocument({ docId, userId });
        documents[docId] = data;
      }
      //enter user data to users object when a new user joins the room
      users[docId] = {
        ...users[docId],
        [socket.id]: {
          name,
          avatar,
          id: userId,
        },
      };
      //emits the document to newly joined user
      socket.emit("load-document", documents[docId]["data"]);
      //emits currently active users on the doc to newly joined user
      socket.emit("current-users", users[docId]);
      //emits currently active users on the doc to all users in the room
      socket.broadcast.to(docId).emit("current-users", users[docId]);

      //receives doc changes from peers and boradcasts to all users in room
      socket.on("send-changes", (delta) => {
        socket.broadcast.to(docId).emit("receive-changes", delta);
      });
      //receives cursor changes from peers and boradcasts to all users in room
      socket.on("update-cursor", (cursorData) => {
        socket.broadcast.to(docId).emit("receive-cursor", cursorData);
      });
      //saves document to memory
      socket.on("save-document", (payload) => {
        documents[docId] = { ...payload };
      });
      //on disconnect
      socket.on("disconnect", async () => {
        //saves the current doc state to db when any user disconnects
        await saveDocument({ docId, ...documents[docId] });
        //delete user who left the room
        delete users[docId][socket.id];
        //brodcasts new users list to all users in room
        socket.broadcast.to(docId).emit("current-users", users[docId]);
        //checks if room is empty
        //if empty deletes documents and users in memory
        const room = io.sockets.adapter.rooms.get(docId);
        if (room === undefined) {
          delete documents[docId];
          delete users[docId];
        }
      });
    });
  });
};

module.exports = ServerSocket;
