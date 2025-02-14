const { Admin } = require("../models/index");
const { HTTP_STATUS_CODE, JWT } = require("../../config/constants");


// Middleware to authenticate an admin using a JWT token.

const authenticateAdmin = async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    //Check for token is provided or not 
    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        msg: "Authorization header missing.",
        data: "",
        err: null,
      });
    }

    // Verify and decode the token
    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        msg: "Invalid or expired token.",
        data: "Token is missing or malformed.",
        err: "",
      });
    }

    // Find the admin in the database with active status
    const admin = await Admin.findOne({
      where: { id: decoded.id, isActive: true, isDeleted: false },
      attributes: ["id", "role", "email"],
    });

     //Return response if admin not found in database 
    if (!admin) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        msg: "Admin not found.",
        data: "",
        err: null,
      });
    }

    // Attach admin details to the request object
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
