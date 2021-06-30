const { Schema, model, Types } = require("mongoose");

const tempUserSchema = new Schema({
  email: { type: String, required: true },
  editor: [{ type: Types.ObjectId, ref: "Document" }],
  viewer: [{ type: Types.ObjectId, ref: "Document" }],
});

module.exports = model("Tuser", tempUserSchema);
