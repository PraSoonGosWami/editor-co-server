const mongoose = require("mongoose");

const DBName = process.env.dbName;
const MongoUser = process.env.mongoUser;
const MongoPsd = process.env.mongoPsd;

const dbURI = `mongodb+srv://${MongoUser}:${MongoPsd}@clusterx.tn29p.mongodb.net/${DBName}?retryWrites=true&w=majority&ssl=true`;

module.exports = async () =>
  await mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });
