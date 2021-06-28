const { Schema, model, Types } = require("mongoose");

const documentSchema = new Schema({
  data: { type: Object },
  creator: { type: Types.ObjectId, ref: "User" },
  viewers: [{ type: Types.ObjectId, ref: "User" }],
  editors: [{ type: Types.ObjectId, ref: "User" }],
});

module.exports = model("Document", documentSchema);
