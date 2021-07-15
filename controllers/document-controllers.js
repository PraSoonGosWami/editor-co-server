const mongoose = require("mongoose");
const documentModel = require("../models/document-model");
const userModel = require("../models/user-model");
const HttpError = require("../models/http-error");
const sendMail = require("../utils/send-mail");

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

//feteches all the document shared with a user
const getAllSharedDocuments = async (req, res, next) => {
  const { userId } = req;
  if (!userId) return res.status(401).json({ message: "Unautorized access" });

  const user = await getUserIdFromGoogleId(userId);
  if (!user) return res.status(401).json({ message: "Unautorized access" });

  let viewer;
  let editor;
  const userEmail = user?.profile?.email;
  try {
    viewer = await documentModel
      .find({ viewers: userEmail })
      .select({ _id: 1, name: 1, createdOn: 1, lastEdited: 1, private: 1 })
      .sort({ createdOn: "desc" });
    editor = await documentModel
      .find({ editors: userEmail })
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

//fetches document by id
const getDocumentsById = async (req, res, next) => {
  const { body, userId } = req;
  const { docId } = body;
  if (!docId) return res.status(422).json({ message: "Invaild entity passed" });
  //checking user authentication
  const user = await getUserIdFromGoogleId(userId);
  if (!user) return res.status(401).json({ message: "Unautorized access" });

  let doc;
  try {
    doc = await documentModel.findById(docId).select({ data: 0 });
  } catch (e) {
    console.log({ message: "Document Fetch error", reason: e });
    return next(new HttpError("Cannot fetch documents. Please try again", 500));
  }
  if (!doc)
    return res.status(404).json({
      message: "No such document found. It might be deleted by the creator",
    });

  const userDbId = user._id;
  const userEmail = user?.profile?.email;
  if (doc.creator.equals(userDbId))
    return res
      .status(200)
      .json({ doc, role: "owner", message: "Document found" });
  if (doc.editors.includes(userEmail))
    return res
      .status(200)
      .json({ doc, role: "editor", message: "Documents found" });
  if (doc.viewers.includes(userEmail) || !doc.private)
    return res
      .status(200)
      .json({ doc, role: "viewer", message: "Documents found" });

  return res
    .status(401)
    .json({ message: "You dont have permissions to access this document" });
};

//deletes a document by id
const deleteDocumentById = async (req, res, next) => {
  const { body, userId } = req;
  const { docId } = body;

  if (!docId) return res.status(422).json({ message: "Invaild entity passed" });
  //checking user authentication
  const user = await getUserIdFromGoogleId(userId);
  if (!user) return res.status(401).json({ message: "Unautorized access" });

  let doc;
  try {
    doc = await documentModel.findById(docId).populate("creator");
  } catch (e) {
    console.log({ message: "Document Fetch error", reason: e });
    return next(
      new HttpError("Cannot delete documents. Please try again", 500)
    );
  }

  if (!doc) return res.status(404).json({ message: "No such documents found" });

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

//updates document name
const updateDocumentById = async (req, res, next) => {
  const { body, userId } = req;
  const { docId, name } = body;
  if (!docId || !name)
    return res.status(422).json({ message: "Invaild entity passed" });
  //checking user authentication
  const user = await getUserIdFromGoogleId(userId);
  if (!user) return res.status(401).json({ message: "Unautorized access" });
  let doc;
  try {
    doc = await documentModel.findById(docId);
  } catch (e) {
    console.log({ message: "Document Fetch error", reason: e });
    return next(new HttpError("Cannot update title. Please try again", 500));
  }
  if (!doc) return res.status(404).json({ message: "No such documents found" });
  if (!doc.creator.equals(user._id))
    return res.status(401).json({
      message: "Only owner of the document can edit document title",
    });

  try {
    doc.name = name;
    await doc.save();
  } catch (e) {
    console.log({ message: "Document update error", reason: e });
    return next(new HttpError("Cannot update title. Please try again", 500));
  }

  res.status(200).json({ message: "Documented updated successfully" });
};

//controls document sharing options for a given id
const updateDocumentSharing = async (req, res, next) => {
  const { body, userId } = req;
  const { docId, shared } = body;
  const { private, editors, viewers } = shared;

  if (!docId || private === null || editors === null || viewers === null)
    return res.status(422).json({ message: "Invaild entity passed" });
  //checking user authentication
  const user = await getUserIdFromGoogleId(userId);
  if (!user) return res.status(401).json({ message: "Unautorized access" });
  let doc;
  try {
    doc = await documentModel.findById(docId);
  } catch (e) {
    console.log({ message: "Document Fetch error", reason: e });
    return next(new HttpError("Something went wrong! Please try again", 500));
  }
  if (!doc) return res.status(404).json({ message: "No such documents found" });
  if (!doc.creator.equals(user._id))
    return res.status(401).json({
      message: "Only owner of the document can manage sharing settings",
    });

  try {
    doc.private = private;
    doc.editors = [...editors];
    doc.viewers = [...viewers];
    await doc.save();
    // const { name, email } = user.profile;
    // const docURL = `https://editor-co.web.app/doc/${doc._id}`;
    // await sendMail([...editors, ...viewers], name, email, doc.name, docURL);
  } catch (e) {
    console.log({ message: "Document sharing update error", reason: e });
    return next(new HttpError("Cannot update detaild. Please try again", 500));
  }
  return res.status(200).json({
    message: "Sharing settings updated",
  });
};

//used internally by sockets

//saves a document by id through sockets
const saveDocument = async ({ docId, data, userId }) => {
  if (!docId || !data || !userId) return;
  const user = await getUserIdFromGoogleId(userId);
  if (!user) return { message: "Unautorized access" };
  try {
    await documentModel.findByIdAndUpdate(docId, {
      data,
      lastEdited: { user: user._id, when: new Date() },
    });
    console.log("Saved to database. userId-", userId);
  } catch (e) {
    return { message: "Cannot save document" };
  }
};

//gets a document by id through sockets
const getDocument = async ({ docId, userId }) => {
  if (!docId || !userId) return;
  const user = await getUserIdFromGoogleId(userId);
  if (!user) return { message: "Unautorized access" };
  try {
    const document = await documentModel.findById(docId);
    return { data: document.data };
  } catch (e) {
    return { message: "Cannot fetch document" };
  }
};

exports.createNewDocument = createNewDocument;
exports.getAllDocuments = getAllDocuments;
exports.getAllSharedDocuments = getAllSharedDocuments;
exports.getDocumentsById = getDocumentsById;
exports.deleteDocumentById = deleteDocumentById;
exports.updateDocumentById = updateDocumentById;
exports.updateDocumentSharing = updateDocumentSharing;
exports.saveDocument = saveDocument;
exports.getDocument = getDocument;
