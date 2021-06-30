const mongoose = require("mongoose");

const password = "defraction44";
const dbName = "editor_co";
const dbURI = `mongodb+srv://Prasoon:${password}@clusterx.tn29p.mongodb.net/${dbName}?retryWrites=true&w=majority&ssl=true`;

module.exports = async () =>
  await mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });
