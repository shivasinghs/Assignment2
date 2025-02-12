const { User, Company } = require("../../../models/index");
const { BCRYPT, JWT, HTTP_STATUS_CODE,VALIDATOR,uuidv4 ,TOKEN_EXPIRY,USER_ROLES} = require("../../../../config/constants");
const validationRules = require("../../../../config/validationRules");
const sendEmail = require("../../../helper/mail/send")
const generateJWTToken = require("../../../helper/auth/generateJWTToken")
const sequelize = require('../../../../config/sequelize')
const client = require("../../../../config/redis")

const signup = async (req, res) => {
  try {
    const { name, gender, phone, email, businessTypeId, companyName, companyDescription, password } = req.body;

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

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        errors: validation.errors.all(),
      });
    }``

    const existingUser = await User.findOne({ where: { email, isDeleted: false },
      attributes : ['id']
     });
    if (existingUser) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Email already exists.",
      });
    }

    const existingCompany = await Company.findOne({ where: { name: companyName, isDeleted: false },
      attributes : ['id']
    });
    
    if (existingCompany) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Company name already exists.",
      });
    }

    const hashedPassword = await BCRYPT.hash(password, 10);

    const userId = uuidv4();

    const verificationToken = generateJWTToken({ userId }, "24h");

    await sequelize.transaction(async (transaction) => {

    const newCompany = await Company.create({
      id: uuidv4(),
      name: companyName,
      description: companyDescription,
      ownerId : userId,
    }, {transaction});

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
    }, {transaction});

  })

    await sendEmail(
      process.env.EMAIL_FROM,
      email,
      "account-verification",
      "verify-account",
      { name,  verificationToken }
    );

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Signup successful. Please verify your email.",
      data: { userId: userId},
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const verifyAccount = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Verification token is required."
      });
    }

    let decoded;
    try {
      decoded = JWT.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Invalid or expired verification token."
      });
    }

    const user = await User.findOne({ 
      where: { id: decoded.userId, isDeleted: false } ,
      attributes : ['id',"isVerified"]
    });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "User not found."
      });
    }

    if (user.isVerified) {
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Your account is already verified."
      });
    }

    await user.update({ isVerified: true });

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Account successfully verified. You can now log in."
    });

  } catch (error) {
    console.error("Error in verifyAccount:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const validation = new VALIDATOR(req.body, {
      email: validationRules.User.email,
      password: validationRules.User.password
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all()
      });
    }

    const user = await User.findOne({ 
      where: { email, isDeleted: false },
      attributes : ["id","password","isVerified","isActive"]
    });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Invalid email or password."
      });
    }

    if (!user.isVerified) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Account not verified. Please check your email."
      });
    }

    if (!user.isActive) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "Account is deactivated. Contact support."
      });
    }

    const isPasswordValid = await BCRYPT.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: "Invalid email or password."
      });
    }
    const token = generateJWTToken({ id: user.id, email }, TOKEN_EXPIRY);

    await client.setEx(user.id.toString(), TOKEN_EXPIRY, token);
    
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
      err: error.message
    });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const validation = new VALIDATOR(req.body, { email: validationRules.User.email });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    const user = await User.findOne({ where: { email, isDeleted: false }, attributes : ['id']});

    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "User not found.",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000)
    const expiresAt = Date.now() + 5 * 60 * 1000

    await sendEmail( process.env.EMAIL_FROM, email,
      "otp-for-resetting-your-password", "forgot-password",
      { name: user.name, otp }
    );

    user.forgotPasswordOtp = otp
    user.forgotPasswordOtpExpiresAt = expiresAt
    await user.save()

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "OTP sent successfully. It expires in 5 minutes.",
    });

  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const validation = new VALIDATOR(req.body, {
      email: validationRules.User.email,
      newPassword: validationRules.User.password,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    const user = await User.findOne({
      where: { email, isDeleted: false },
      attributes: [
        "id",
        "forgotPasswordOtp",
        "forgotPasswordOtpExpiresAt",
        "password",
      ],
    });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "User not found.",
        err: null,
      });
    }

    if (!user.forgotPasswordOtp || user.forgotPasswordOtp !== otp) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid OTP.",
        err: null,
      });
    }

    if (user.forgotPasswordOtpExpiresAt < Date.now()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "OTP has expired.",
        err: null,
      });
    }

    const hashedPassword = await BCRYPT.hash(newPassword, 10);

    user.password = hashedPassword;
    user.updatedAt = Math.floor(Date.now() / 1000);
    user.updatedBy = user.id;
    user.forgotPasswordOtp = null;
    user.forgotPasswordOtpExpiresAt = null;
    await user.save();

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Password reset successful. You can now log in with your new password.",
    });

  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message,
    });
  }
};

module.exports = { 
   signup, 
   verifyAccount,
   login , 
   forgotPassword,
   resetPassword
  };
