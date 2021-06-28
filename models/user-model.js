const { Schema, model, Types } = require("mongoose");

const userSchema = new Schema({
  profile: { type: Object },
  documents: [{ type: Types.ObjectId, ref: "Document" }],
  sharedWithMe: [{ type: Types.ObjectId, ref: "Document" }],
  plan: { type: String, required: true, default: "PLAN_FREE" },
});

module.exports = model("User", userSchema);
