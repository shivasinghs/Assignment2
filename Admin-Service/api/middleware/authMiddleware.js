const { Admin } = require("../models/index");
const { HTTP_STATUS_CODE, JWT } = require("../../config/constants");
const i18n = require("../../config/i18n");

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        msg: i18n.__("messages.NO_AUTH_HEADER"),
        data: "",
        err: null,
      });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findOne({ where: { id: decoded.adminId }, attributes: ["id"] });

    if (!admin) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        msg: i18n.__("Admin.Auth.Admin_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    req.admin = admin;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
      msg: i18n.__("messages.INVALID_TOKEN"),
      data: error.message,
      err: "",
    });
  }
};

module.exports = authenticateUser;