const { Admin } = require("../models/index");
const { HTTP_STATUS_CODE, JWT } = require("../../config/constants");

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        msg: "Authorization header missing.",
        data: "",
        err: null,
      });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        msg: "Invalid or expired token.",
        data: "Token is missing or malformed.",
        err: "",
      });
    }

    const admin = await Admin.findOne({
      where: { id: decoded.id, isActive: true, isDeleted: false },
      attributes: ["id", "role", "email"],
    });

    if (!admin) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        msg: "Admin not found.",
        data: "",
        err: null,
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
      msg: "Invalid or expired token.",
      data: error.message,
      err: "",
    });
  }
};

module.exports = authenticateAdmin;
