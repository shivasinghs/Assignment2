const { User, Company } = require("../../../models/index");
const { BCRYPT, JWT, HTTP_STATUS_CODE,VALIDATOR,uuidv4 ,TOKEN_EXPIRY_DAY,USER_ROLES , MAIL_TYPES,MAIL_TEMPLATES} = require("../../../../config/constants");
const validationRules = require("../../../../config/validationRules");
const sendEmail = require("../../../helper/mail/send")
const {generateJWTToken} = require("../../../helper/auth/generateJWTToken")
const sequelize = require('../../../../config/sequelize')
const client = require("../../../../config/redis")

const signup = async (req, res) => {
  try {
    // Extract user input from request body
    const { name, gender, phone, email, businessTypeId, companyName, companyDescription, password } = req.body;

    // Validate input fields using defined validation rules
    const validation = new VALIDATOR(req.body, {
      name: validationRules.User.name,
      gender: validationRules.User.gender,
      phone: validationRules.User.phone,
      email: validationRules.User.email,
      businessTypeId: validationRules.User.businessTypeId,
      password: validationRules.User.password,
      companyName: validationRules.Company.name,
      companyDescription: validationRules.Company.description,
    });

    // If validation fails, return an error response
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        errors: validation.errors.all(),
      });
    }

    // Check if the user with the given email already exists
    const existingUser = await User.findOne({
      where: { email, isDeleted: false },
      attributes: ['id']
    });

    // If user already exists, return an error response
    if (existingUser) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Email already exists.",
        data: "",
        error: ""
      });
    }

    // Check if a company with the given name already exists
    const existingCompany = await Company.findOne({
      where: { name: companyName, isDeleted: false },
      attributes: ['id']
    });

    // If company already exists, return an error response
    if (existingCompany) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Company name already exists.",
        data: "",
        error: ""
      });
    }

    // Hash the user's password before storing it
    const hashedPassword = await BCRYPT.hash(password, 10);

    // Generate a unique user ID
    const userId = uuidv4();

    // Generate a verification token for email verification
    const verificationToken = generateJWTToken({ userId }, TOKEN_EXPIRY_DAY);

    // Use a database transaction to ensure atomic operations for company and user creation
    await sequelize.transaction(async (transaction) => {
      // Create a new company record
      const newCompany = await Company.create({
        id: uuidv4(),
        name: companyName,
        description: companyDescription,
        ownerId: userId,
      }, { transaction });

      // Create a new user record associated with the newly created company
      await User.create({
        id: userId,
        name,
        email,
        password: hashedPassword,
        gender,
        phone,
        businessTypeId,
        companyId: newCompany.id,
        role: USER_ROLES.OWNER, 
      }, { transaction });
    });

    // Send a verification email to the user
    await sendEmail(
      process.env.EMAIL_FROM,
      email,
      MAIL_TYPES.ACCOUNT_VERIFICATION,
      MAIL_TEMPLATES.VERIFY_ACCOUNT,
      { name, verificationToken }
    );

    // Return success response after successful signup
    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Signup successful. Please verify your email.",
      data: { userId: userId },
    });
  } catch (error) {
    // Handle and log errors in the signup process
    console.error("Error in signup:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const verifyAccount = async (req, res) => {
  try {
    // Extract the token from query parameters
    const { token } = req.query;

    // Check if the token is provided
    if (!token) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Verification token is required.",
        data: "",
        error: ""
      });
    }

    let decoded;
    try {
      // Verify and decode the token using JWT
      decoded = JWT.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // If token is invalid or expired, return an error response
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Invalid or expired verification token.",
        data: "",
        error: ""
      });
    }

    // Find the user associated with the decoded token
    const user = await User.findOne({
      where: { id: decoded.userId, isDeleted: false },
      attributes: ['id', "isVerified"]
    });

    // If user is not found, return an error response
    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "User not found.",
        data: "",
        error: ""
      });
    }

    // If the account is already verified, return a success response
    if (user.isVerified) {
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Your account is already verified.",
        data: "",
        error: ""
      });
    }

    // Update the user's isVerified status to true
    await user.update({ isVerified: true });

    // Return a success response after successful verification
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Account successfully verified. You can now log in.",
      data: "",
      error: ""
    });

  } catch (error) {
    // Handle and log errors in the account verification process
    console.error("Error in verifyAccount:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      err: error.message
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    // Extract email from request body
    const { email } = req.body;

    // Validate email format using predefined validation rules
    const validation = new VALIDATOR(req.body, { email: validationRules.User.email });

    // If validation fails, return a bad request response
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Find the user by email, ensuring they are not deleted
    const user = await User.findOne({ where: { email, isDeleted: false }, attributes: ['id'] });

    // If the user does not exist, return a not found response
    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "User not found.",
        data: "",
        error: ""
      });
    }

    // Generate a 4-digit OTP for password reset
    const otp = Math.floor(1000 + Math.random() * 9000);
    
    // Set OTP expiration time (5 minutes from now)
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Send the OTP via email to the user
    await sendEmail(
      process.env.EMAIL_FROM,
      email,
      MAIL_TYPES.OTP_FOR_RESETTING_YOUR_PASSWORD,
      MAIL_TEMPLATES.FORGOT_PASSWORD,
      { name: user.name, otp }
    );

    // Save the OTP and its expiration timestamp in the user's record
    user.forgotPasswordOtp = otp;
    user.forgotPasswordOtpExpiresAt = expiresAt;
    await user.save();

    // Return success response indicating the OTP has been sent
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "OTP sent successfully. It expires in 5 minutes.",
      data: "",
      error: ""
    });

  } catch (error) {
    // Handle and log any errors in the forgot password process
    console.error("Error in forgotPassword:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    // Extract email, OTP, and new password from request body
    const { email, otp, newPassword } = req.body;

    // Validate email and new password format using predefined validation rules
    const validation = new VALIDATOR(req.body, {
      email: validationRules.User.email,
      newPassword: validationRules.User.password,
    });

    // If validation fails, return a bad request response
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Find the user by email, ensuring they are not deleted
    const user = await User.findOne({
      where: { email, isDeleted: false },
      attributes: [
        "id",
        "forgotPasswordOtp",
        "forgotPasswordOtpExpiresAt",
        "password",
      ],
    });

    // If the user does not exist, return a not found response
    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "User not found.",
        data: "",
        error: null,
      });
    }

    // Check if OTP exists and matches the provided OTP
    if (!user.forgotPasswordOtp || user.forgotPasswordOtp !== otp) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid OTP.",
        data: "",
        err: null,
      });
    }

    // Check if the OTP has expired
    if (user.forgotPasswordOtpExpiresAt < Date.now()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "OTP has expired.",
        data: "",
        err: null,
      });
    }

    // Hash the new password before saving it to the database
    const hashedPassword = await BCRYPT.hash(newPassword, 10);

    // Update user password and reset OTP-related fields
    user.password = hashedPassword;
    user.updatedAt = Math.floor(Date.now() / 1000);
    user.updatedBy = user.id;
    user.forgotPasswordOtp = null;
    user.forgotPasswordOtpExpiresAt = null;
    await user.save();

    // Return success response indicating the password reset was successful
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Password reset successful. You can now log in with your new password.",
      data: "",
      error: "",
    });

  } catch (error) {
    // Handle and log any errors in the reset password process
    console.error("Error in resetPassword:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

module.exports = { 
   signup, 
   verifyAccount,
   forgotPassword,
   resetPassword
  };
