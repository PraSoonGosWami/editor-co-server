const express = require("express");
const app = express();
const server = require("http").Server(app);
const mongoose = require("mongodb");
const cors = require("cors");

const ServerSocket = require("./socket");
const userRoutes = require("./routes/user-routes");

const PORT = process.env.PORT || 5000;
const password = "defraction44";
const dbName = "google_docs_clone";

app.use(cors());
app.use(express.json({ limit: "30mb", extended: false }));
app.use(express.urlencoded({ limit: "30mb", extended: false }));

app.get("/", (req, res) => res.status(200).json("hello world"));

app.use("/api/auth", userRoutes);

//Server socket
ServerSocket(server);

//connecting to database
mongoose
  .connect(
    `mongodb+srv://Prasoon:${password}@clusterx.tn29p.mongodb.net/${dbName}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    }
  )
  .then(() =>
    server.listen(PORT, () => console.log(`Listening on port ${PORT}`))
  )
  .catch((err) => {
    console.log(err);
  });
