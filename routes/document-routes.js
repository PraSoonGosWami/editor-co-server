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

module.exports = router;
