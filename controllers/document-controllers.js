const mongoose = require("mongoose");
const documentModel = require("../models/document-model");
const tUserModel = require("../models/temp-user-model");
const userModel = require("../models/user-model");
const HttpError = require("../models/http-error");

const getUserIdFromGoogleId = async (userId) => {
  let user;
  try {
    user = await userModel.findOne({ googleId: userId });
  } catch (e) {
    console.log({ message: "Fetch error", reason: e });
    return next(new HttpError("Cannot fetch documents. Please try again", 500));
  }
  return user;
};

//creates a new document
const createNewDocument = async (req, res, next) => {
  const { userId, body } = req;
  const { name, private } = body;

  if (!userId) return res.status(401).json({ message: "Unautorized access" });
  if (!name || private === null)
    return res.status(422).json({ message: "Invaild entity passed" });

  //checking user authentication
  const user = await getUserIdFromGoogleId(userId);
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
    id: newDoc._id,
    message: "Document created!",
  });
};

//feteches all documents for a given user
const getAllDocuments = async (req, res, next) => {
  const { userId } = req;
  if (!userId) return res.status(401).json({ message: "Unautorized access" });

  //checking user authentication
  const user = await getUserIdFromGoogleId(userId);
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

// fetches document by id
const getDocumentsById = async (req, res, next) => {
  const { body, userId } = req;
  const { docId } = body;

  //checking user authentication
  const user = await getUserIdFromGoogleId(userId);
  if (!user) return res.status(401).json({ message: "Unautorized access" });

  let doc;
  try {
    doc = await documentModel.findById(docId);
  } catch (e) {
    console.log({ message: "Document Fetch error", reason: e });
    return next(new HttpError("Cannot fetch documents. Please try again", 500));
  }
  if (!doc)
    return res
      .status(404)
      .json({
        message: "No such document found. It might be deleted by the creator",
      });

  const userDbId = user._id;
  if (doc.creator.equals(userDbId))
    return res
      .status(200)
      .json({ doc, role: "owner", message: "Document found" });
  if (doc.editors.includes(userDbId))
    return res
      .status(200)
      .json({ doc, role: "editor", message: "Documents found" });
  if (doc.viewers.includes(userDbId) || !doc.private)
    return res
      .status(200)
      .json({ doc, role: "viewer", message: "Documents found" });

  return res
    .status(401)
    .json({ message: "You dont have permissions to access this document" });
};

//feteches all the document shared with a user
const getAllSharedDocuments = async (req, res, next) => {
  const { userId } = req;
  if (!userId) return res.status(401).json({ message: "Unautorized access" });

  const user = await getUserIdFromGoogleId(userId);

  if (!user) return res.status(401).json({ message: "Unautorized access" });

  let viewer;
  let editor;
  try {
    viewer = await documentModel
      .find({ viewers: user._id })
      .select({ _id: 1, name: 1, createdOn: 1, lastEdited: 1, private: 1 })
      .sort({ createdOn: "desc" });
    editor = await documentModel
      .find({ editors: user._id })
      .select({ _id: 1, name: 1, createdOn: 1, lastEdited: 1, private: 1 })
      .sort({ createdOn: "desc" });
  } catch (e) {
    console.log({ message: "Fetch error", reason: e });
    return next(new HttpError("Cannot fetch documents. Please try again", 500));
  }
  res.status(200).json({
    editor: editor || [],
    viewer: viewer || [],
    message: "Fetched successfully!",
  });
};

const deleteDocumentById = async (req, res, next) => {
  const { body, userId } = req;
  const { docId } = body;

  //checking user authentication
  const user = await getUserIdFromGoogleId(userId);
  if (!user) return res.status(401).json({ message: "Unautorized access" });

  let doc;
  try {
    doc = await documentModel.findById(docId).populate("creator");
  } catch (e) {
    console.log({ message: "Document Fetch error", reason: e });
    return next(new HttpError("Cannot fetch documents. Please try again", 500));
  }

  if (!doc) return res.status(404).json({ message: "No such documents found" });

  //return res.status(200).json({ doc });
  if (!doc.creator._id.equals(user._id))
    return res.status(401).json({
      message: "Sorry! You don't have access to delete this document",
    });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await doc.remove({ session: sess });
    doc.creator.documents.pull(doc);
    await doc.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log({ message: "Document Fetch error", reason: e });
    return next(
      new HttpError("Something went wrong, could not delete document.", 500)
    );
  }

  res.status(200).json({ message: "Documented deleted successfully" });
};

//saves a document by id through sockets
const saveDocumentById = async ({ docId, data, userId }) => {
  if (!docId || !data || !userId) return;
  const user = await getUserIdFromGoogleId(userId);
  if (!user) return { message: "Unautorized access" };
  try {
    await documentModel.findByIdAndUpdate(docId, {
      data,
      lastEdited: { user: user._id, when: new Date() },
    });
  } catch (e) {
    return { message: "Cannot save document" };
  }
};

exports.createNewDocument = createNewDocument;
exports.getAllDocuments = getAllDocuments;
exports.getDocumentsById = getDocumentsById;
exports.getAllSharedDocuments = getAllSharedDocuments;
exports.deleteDocumentById = deleteDocumentById;
exports.saveDocumentById = saveDocumentById;
