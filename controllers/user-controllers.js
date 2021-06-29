const userModel = require("../models/user-model");
const HttpError = require("../models/http-error");

/**
 * User google auth controller
 */

const auth = async (req, res, next) => {
  const { profile, googleId } = req.body;

  let exisitingUser;
  try {
    exisitingUser = await userModel.findOne({ googleId });
  } catch (e) {
    console.error({ message: "User authentication failed.", reason: e });
    return next(new HttpError("Cannot create user!", 500));
  }
  if (exisitingUser)
    return res.status(201).json({ message: "Logged in succesfully" });

  try {
    await userModel.create({
      googleId,
      profile,
      documents: [],
      sharedWithMe: [],
    });
  } catch (e) {
    console.error({ message: "User authentication failed.", reason: e });
    return next(new HttpError("Cannot create user!", 500));
  }
  return res.status(201).json({ message: "Logged in succesfully" });
};

exports.auth = auth;
