const router = require("express").Router();
const userControllers = require("../controllers/user-controllers");

/**
 * @post
 * google authentication
 */
router.post("/", userControllers.auth);

module.exports = router;
