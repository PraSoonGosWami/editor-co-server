const { Schema, model, Types } = require("mongoose");

const userSchema = new Schema({
  googleId: { type: String, required: true },
  profile: { type: Object, required: true },
  documents: [{ type: Types.ObjectId, ref: "Document" }],
  viewer: [{ type: Types.ObjectId, ref: "Document" }],
  editor: [{ type: Types.ObjectId, ref: "Document" }],
  plan: { type: String, required: true, default: "PLAN_FREE" },
});

module.exports = model("User", userSchema);
