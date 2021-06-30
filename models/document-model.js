const { Schema, model, Types } = require("mongoose");

const documentSchema = new Schema({
  name: { type: String, required: true },
  data: { type: Object, required: true, default: "" },
  creator: { type: Types.ObjectId, ref: "User", required: true },
  viewers: [{ type: Types.ObjectId, ref: "User" }],
  editors: [{ type: Types.ObjectId, ref: "User" }],
  createdOn: { type: Date, required: true },
  lastEdited: { type: Object, default: {} },
  private: { type: Boolean, require: true },
});

module.exports = model("Document", documentSchema);
