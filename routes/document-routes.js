const router = require("express").Router();
const checkAuth = require("../middlewares/check-auth");
const documentControllers = require("../controllers/document-controllers");

/**
 * @post
 * creates new document
 * and returns newley created document with it id
 * /api/v1/doc/create
 */
router.post("/create", checkAuth, documentControllers.createNewDocument);

/**
 * @get
 * feteches all document by user id
 * /api/v1/doc/get/user
 */

router.get("/get/user", checkAuth, documentControllers.getAllDocuments);

/**
 * @get
 * feteches all shared documents by user id
 * /api/v1/doc/get/shared
 */

router.get("/get/shared", checkAuth, documentControllers.getAllSharedDocuments);

/**
 * @post
 * fetches document with a given id
 * /api/v1/doc/get/byId
 */

router.post("/get/byId", checkAuth, documentControllers.getDocumentsById);

/**
 * @delete
 * delete document with a given id
 * /api/v1/doc/delete/byId
 */

router.post("/delete/byId", checkAuth, documentControllers.deleteDocumentById);

module.exports = router;
