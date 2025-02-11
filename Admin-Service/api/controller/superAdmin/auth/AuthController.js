const { Admin } = require("../../../models/index");
const { generateToken } = require("../../../helper/auth/generateJWTToken");
const { HTTP_STATUS_CODE, BCRYPT, Op, VALIDATOR, TOKEN_EXPIRY, ADMIN_ROLES } = require("../../../../config/constants");
const validationRules = require("../../../../config/validationRules");
const client = require("../../../../config/redis")

const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const validation = new VALIDATOR(req.body,{
      email : validationRules.Admin.email,
      password : validationRules.Admin.password
    });
    
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        err: validation.errors.all()
      });
    }

    const admin = await Admin.findOne({
      where: {
        email: email,
        role: ADMIN_ROLES.SUPER_ADMIN,
      },
      attributes: ["id", "password", "isDeleted", "isActive"]
    });

    if (!admin) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid credentials.",
        data: "",
        err: null
      });
    }

    if (admin.isDeleted) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Admin not found.",
        data: "",
        err: null
      });
    }

    if (!admin.isActive) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Account is inactive.",
        data: "",
        err: null
      });
    }

    const isPasswordValid = await BCRYPT.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid credentials.",
        data: "",
        err: null
      });
    }

    const token = generateToken({ adminId: admin.id, email: admin.email, role: ADMIN_ROLES.SUPER_ADMIN }, TOKEN_EXPIRY);

    await client.set(admin.id.toString(), token);

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Login successful.",
      data: { adminId: admin.id, email: admin.email, role: ADMIN_ROLES.SUPER_ADMIN, token },
      err: null
    });
  } catch (error) {
    console.error("Error in superAdminLogin:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
      err: error
    });
  }
};

module.exports = {
  superAdminLogin
};
