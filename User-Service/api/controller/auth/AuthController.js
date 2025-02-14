const { User } = require("../../models/index");
const { BCRYPT,HTTP_STATUS_CODE,VALIDATOR,TOKEN_EXPIRY} = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const { generateJWTToken } = require("../../helper/auth/generateJWTToken")
const client = require("../../../config/redis")

const login = async (req, res) => {
    try {
      // Extract required fields from request body
      const { email, password } = req.body;
  
      //Validate the request body fields
      const validation = new VALIDATOR(req.body, {
        email: validationRules.User.email,
        password: validationRules.User.password
      });
  
      //if validation fails return error
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid input.",
          data : "",
          error: validation.errors.all()
        });
      }
  
      //find user in database with email and select required fields
      const user = await User.findOne({ 
        where: { email, isDeleted: false },
        attributes : ["id","password","isVerified","isActive"]
      });
  
      //if user not found return a response
      if (!user) {
        return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
          status: HTTP_STATUS_CODE.UNAUTHORIZED,
          message: "Invalid email or password.",
          data : "",
          error : ""
        });
      }
  
      //check for user verification
      if (!user.isVerified) {
        return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
          status: HTTP_STATUS_CODE.UNAUTHORIZED,
          message: "Account not verified. Please check your email.",
          data : "",
          error : ""
        });
      }
  
      // If user is not active return a response 
      if (!user.isActive) {
        return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
          status: HTTP_STATUS_CODE.FORBIDDEN,
          message: "Account is deactivated. Contact support.",
          data : "",
          error : ""
        });
      }
  
      //Compare the password provide in request body with password stored in database
      const isPasswordValid = await BCRYPT.compare(password, user.password);
  
      //If password is not correct return a response
      if (!isPasswordValid) {
        return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
          status: HTTP_STATUS_CODE.UNAUTHORIZED,
          message: "Invalid email or password.",
          data : "",
          error : ""
        });
      }

      //Generate a JWT token for authentication
      const token = generateJWTToken({ id: user.id, email }, TOKEN_EXPIRY);
  
      //Storing the admin id in Redis Database
      await client.setEx(user.id.toString(), TOKEN_EXPIRY, "");
      
       //return a success response
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Login successful.",
        data: { 
          userId: user.id,
          email: user.email,
          role: user.role,
          token: token
        } 
      });
  
    } catch (error) {
      console.error("Error in login:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        data : "",
        error: error.message
      });
    }
  };

module.exports = {
  login
};
