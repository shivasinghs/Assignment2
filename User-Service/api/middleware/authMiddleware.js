const { User } = require("../models/index");
const { HTTP_STATUS_CODE,JWT } = require("../../config/constants");
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
  
      const user = await User.findOne({ where: { id: decoded.userId } });
  
      if (!user) {
        return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
          msg: i18n.__("User.Auth.USER_NOT_FOUND"),
          data: "",
          err: null,
        });
      }
  
      req.user = user;
  
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        msg: i18n.__("messages.INVALID_TOKEN"),
        data: "",
        err: error.message,
      });
    }
  };

module.exports = authenticateUser;