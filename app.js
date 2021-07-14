const express = require("express");
const app = express();
const server = require("http").Server(app);
const cors = require("cors");

const mongo = require("./database/mongo");
const ServerSocket = require("./socket");
const documentRoutes = require("./routes/document-routes");
const userRoutes = require("./routes/user-routes");

const PORT = process.env.PORT || 5000;

mongo()
  .then(() => {
    server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  })
  .catch((err) => {
    console.log(err);
  });

//CORS policy protection
const whitelist = [
  "https://editor-co.web.app",
  "https://editor-co.firebaseapp.com",
  "http://localhost:3000",
];
const corsOptions = {
  origin: whitelist,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.status(200).json("hello world"));

app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/doc", documentRoutes);

//Server socket
ServerSocket(server);
