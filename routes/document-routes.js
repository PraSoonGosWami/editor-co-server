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
 * @post
 * delete document with a given id
 * /api/v1/doc/delete/byId
 */

router.post("/delete/byId", checkAuth, documentControllers.deleteDocumentById);

/**
 * @post
 * updates document name with a given id
 * /api/v1/doc/update/byId
 */

router.post("/update/byId", checkAuth, documentControllers.updateDocumentById);

/**
 * @post
 * updates document sharing settings with a given id
 * /api/v1/doc/sharing/byId
 */

router.post(
  "/sharing/byId",
  checkAuth,
  documentControllers.updateDocumentSharing
);

module.exports = router;
