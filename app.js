const express = require("express");
const app = express();
const server = require("http").Server(app);
const cors = require("cors");

const mongo = require("./database/mongo");
const ServerSocket = require("./socket");
const userRoutes = require("./routes/user-routes");

const PORT = process.env.PORT || 5000;

mongo()
  .then(() => {
    server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  })
  .catch((err) => {
    console.log(err);
  });

app.use(cors());
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.status(200).json("hello world"));

app.use("/api/v1/auth", userRoutes);

//Server socket
ServerSocket(server);
