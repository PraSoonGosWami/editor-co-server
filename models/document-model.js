const { Schema, model, Types } = require("mongoose");

const documentSchema = new Schema({
  name: { type: String, required: true },
  data: { type: Object, required: true, default: "" },
  creator: { type: Types.ObjectId, ref: "User", required: true },
  viewers: [{ type: String }],
  editors: [{ type: String }],
  createdOn: { type: Date, required: true },
  lastEdited: { type: Object, default: {} },
  private: { type: Boolean, require: true },
});

module.exports = model("Document", documentSchema);
