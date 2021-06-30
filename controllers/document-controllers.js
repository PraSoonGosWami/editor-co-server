const mongoose = require("mongoose");
const documentModel = require("../models/document-model");
const tUserModel = require("../models/temp-user-model");
const userModel = require("../models/user-model");
const HttpError = require("../models/http-error");

//creates a new document
const createNewDocument = async (req, res, next) => {
  const { userId, body } = req;
  const { name, private } = body;
  console.log(userId);
  if (!userId) return res.status(401).json({ message: "Unautorized access" });
  if (!name || private === null)
    return res.status(422).json({ message: "Invaild entity passed" });
  let user;
  try {
    user = await userModel.findOne({ googleId: userId });
  } catch (e) {
    return next(new HttpError("Cannot create document. Please try again", 500));
  }

  if (!user) return res.status(401).json({ message: "Unautorized access" });
  const newDoc = new documentModel({
    name,
    creator: user._id,
    viewers: [],
    editors: [],
    createdOn: new Date(),
    lastEdited: { user: user._id, when: new Date() },
    private,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newDoc.save({ session: sess });
    user.documents.push(newDoc);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (e) {
    console.log({ message: "Session error", reason: e });
    return next(new HttpError("Cannot create a new document", 500));
  }

  res.status(201).json({
    name: newDoc.name,
    data: newDoc.data,
    id: newDoc._id,
    message: "Document created!",
  });
};

//feteches all documents for a given user
const getAllDocuments = async (req, res, next) => {
  const { userId } = req;
  if (!userId) return res.status(401).json({ message: "Unautorized access" });

  let user;
  try {
    user = await userModel.findOne({ googleId: userId });
  } catch (e) {
    console.log({ message: "Fetch error", reason: e });
    return next(new HttpError("Cannot fetch documents. Please try again", 500));
  }
  if (!user) return res.status(401).json({ message: "Unautorized access" });

  let docs;
  try {
    docs = await documentModel
      .find({ creator: user._id })
      .select({ _id: 1, name: 1, createdOn: 1, lastEdited: 1, private: 1 })
      .sort({ createdOn: "desc" });
  } catch (e) {
    console.log({ message: "Fetch error", reason: e });
    return next(new HttpError("Cannot fetch documents. Please try again", 500));
  }
  res.status(200).json({
    data: docs || [],
    message: "Fetched successfully!",
  });
};

exports.createNewDocument = createNewDocument;
exports.getAllDocuments = getAllDocuments;
