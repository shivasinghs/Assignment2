const { User } = require("../models/index");
const { HTTP_STATUS_CODE, JWT } = require("../../config/constants");

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Authorization token is missing.",
        err: null,
      });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({ where: { id: decoded.id, isDeleted: false },attributes: ["id","role","email","companyId"] });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "User not found or unauthorized.",
        err: null,
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
      status: HTTP_STATUS_CODE.UNAUTHORIZED,
      message: "Invalid or expired token.",
      err: error.message,
    });
  }
};

module.exports = authenticateUser;
