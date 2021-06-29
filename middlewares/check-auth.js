const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; // Auth 'Bearer TOKEN'
    if (!token) {
      return next(new HttpError("Auth token unavailable", 400));
    }
    const decodedToken = jwt.decode(token);
    req.userId = decodedToken?.sub;
    next();
  } catch (e) {
    console.log(`Auth middleware failed ${e}`);
    return next(new HttpError("Authentication failed", 403));
  }
};
