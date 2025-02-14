const { User } = require("../models/index");
const { HTTP_STATUS_CODE, JWT } = require("../../config/constants");

// Middleware to authenticate an user using a JWT token.

const authenticateUser = async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    //Check for token is provided or not 
    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Authorization token is missing.",
        data: null,
        error: null,
      });
    }

    // Verify and decode the token
    const decoded = JWT.verify(token, process.env.JWT_SECRET);

     // Find the user in the database with active status
    const user = await User.findOne({ 
      where: { id: decoded.id, isDeleted: false, isActive : true },
      attributes: ["id", "role", "email", "companyId"]
    });

    //Return response if user not found in database 
    if (!user) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "User not found or unauthorized.",
        data: null,
        error: null,
      });
    }

    // Attach user  details to the request object
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
