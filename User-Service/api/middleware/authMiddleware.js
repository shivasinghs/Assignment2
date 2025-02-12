const { User } = require("../models/index");
const { HTTP_STATUS_CODE, JWT } = require("../../config/constants");
const client = require("../../config/redis");

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Authorization token is missing.",
        data: null,
        error: null,
      });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    
    const storedToken = await client.get(decoded.id.toString());

    if (!storedToken || storedToken !== token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Session expired or invalid token. Please login again.",
        data: null,
        error: null,
      });
    }

    const user = await User.findOne({ 
      where: { id: decoded.id, isDeleted: false, isActive : true },
      attributes: ["id", "role", "email", "companyId"]
    });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "User not found or unauthorized.",
        data: null,
        error: null,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
      status: HTTP_STATUS_CODE.UNAUTHORIZED,
      message: "Invalid or expired token.",
      data: null,
      error: error.message,
    });
  }
};

module.exports = authenticateUser;
