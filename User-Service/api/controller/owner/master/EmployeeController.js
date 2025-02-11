const { User,Company } = require("../../../models/index"); 
const { BCRYPT, HTTP_STATUS_CODE, USER_ROLES, VALIDATOR } = require("../../../../config/constants");
const validationRules = require("../../../../config/validationRules");
const sendEmail = require("../../../helper/mail/send");
const deleteImage = require("../../../helper/imageHandler/delete");
// const sequelize = require('../../../../config/sequelize');


const createEmployee = async (req, res) => {
  try {
    const { name, gender, phone, email, password, companyId } = req.body;
    const image = req.file;
    const owner = req.user;
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

    const validation = new VALIDATOR(req.body, {
      name: validationRules.User.name,
      email: validationRules.User.email,
      password: validationRules.User.password,
      gender: validationRules.User.gender,
      phone: validationRules.User.phone,
      companyId: validationRules.User.companyId,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    if (owner.role !== USER_ROLES.OWNER) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
      });
    }

    if (email.toLowerCase() === owner.email.toLowerCase()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "You cannot create an employee with the same email as the owner.",
      });
    }

    const existingEmployee = await User.findOne({
      where: { email, isDeleted: false },
      attributes: ['id'],
    });

    if (existingEmployee) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Email already exists.",
      });
    }

    const existingCompany = await Company.findOne({
      where: { id: companyId,ownerId : owner.id, isDeleted: false },
      attributes :['id']
    });

    if (!existingCompany) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Company not found or you do not have permission to assign employees to this company.",
      });
    }

    let imagePath = null;
    if (image) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(image.mimetype) || image.size > 2 * 1024 * 1024) {
        deleteImage(image.path);
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid image. Only PNG, JPEG, JPG allowed & max size 2MB.",
        });
      }
      imagePath = baseUrl + image.filename;
    }

    const hashedPassword = await BCRYPT.hash(password, 10);

    const newEmployee = await User.create({
      name,
      email,
      password: hashedPassword,
      gender,
      phone,
      profileImage: imagePath,
      role: USER_ROLES.EMPLOYEE,
      companyId,
      isVerified : true,  
      createdBy: owner.id,  
    });

    await sendEmail(
      process.env.EMAIL_FROM,
      newEmployee.email,
      "create-employee",
      "employee-invite",
      {
        name: newEmployee.name,
        email: newEmployee.email,
        password,
      }
    );

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Employee created successfully.",
      data: { EmployeeId: newEmployee.id, },
    });
  } catch (error) {
    console.error("Error in createEmployee:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message,
    });
  }
};


const getEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const owner = req.user;

    const validation = new VALIDATOR(req.params, {
      employeeId: validationRules.User.id,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    if (owner.role !== USER_ROLES.OWNER) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to view this employee's details.",
      });
    }

    const employee = await User.findOne({
      where: { id: employeeId, role: USER_ROLES.EMPLOYEE, isDeleted: false, isActive: true },
      attributes: ["id", "name", "email", "gender", "phone", "profileImage", "role"],
    });

    if (!employee) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Employee not found.",
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Employee details retrieved successfully.",
      data: employee,
    });
  } catch (error) {
    console.error("Error in getEmployeeById:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message,
    });
  }
};

const updateEmployee = async (req, res) => {
    try {
      const { employeeId, name, gender, phone, email, removeImage } = req.body;
      const owner = req.user;
      const image = req.file;
      const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;
  
      const validation = new VALIDATOR(req.body, {
        employeeId: validationRules.User.id,
        name: validationRules.User.name,
        gender: validationRules.User.gender,
        phone: validationRules.User.phone,
        email: validationRules.User.email, 
      });
  
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid input.",
          err: validation.errors.all(),
        });
      }
  
      if (owner.role !== USER_ROLES.OWNER) {
        return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
          status: HTTP_STATUS_CODE.FORBIDDEN,
          message: "You do not have permission to update this employee's details.",
        });
      }

      if (email && email.toLowerCase() === owner.email.toLowerCase()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "You cannot update the employee's email to be the same as the owner's email.",
        });
      }
  
      const employee = await User.findOne({
        where: { id: employeeId, role: USER_ROLES.EMPLOYEE, isActive: true, isDeleted: false },
        attributes: ["id", "profileImage", "email"],
      });
  
      if (!employee) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "Employee not found or has been deleted.",
        });
      }
  
      let imagePath = employee.profileImage;
  
      if (image) {
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!allowedTypes.includes(image.mimetype) || image.size > 2 * 1024 * 1024) {
          deleteImage(image.path);
          return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
            status: HTTP_STATUS_CODE.BAD_REQUEST,
            message: "Invalid image. Only PNG, JPEG, JPG allowed & max size 2MB.",
          });
        }
  
        if (imagePath) {
          deleteImage(imagePath.replace(baseUrl, ""));
        }
        imagePath = baseUrl + image.filename;
      }
  
      if (removeImage === "true" && imagePath) {
        deleteImage(employee.profileImage.replace(baseUrl, ""));
        imagePath = null;
      }
  
      await employee.update({
        name: name || employee.name,
        gender: gender || employee.gender,
        phone: phone || employee.phone,
        email: email || employee.email, 
        profileImage: imagePath,
        updatedAt: Math.floor(Date.now() / 1000),
        updatedBy: owner.id,  
      });
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Employee updated successfully.",
        data: { employeeId },
      });
    } catch (error) {
      console.error("Error in updateEmployee:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        err: error.message,
      });
    }
  };
  

const toggleEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const owner = req.user;

    if (owner.role !== USER_ROLES.OWNER) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
      });
    }

    const employee = await User.findOne({
      where: { id: employeeId, role: USER_ROLES.EMPLOYEE, isDeleted: false },
      attributes: ["id", "isActive"],
    });

    if (!employee) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Employee not found.",
      });
    }


    employee.isActive = !employee.isActive;
    employee.updatedAt = Math.floor(Date.now() / 1000);
    employee.updatedBy = owner.id;
    await employee.save();

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: `Employee ${employee.isActive ? "activated" : "deactivated"} successfully.`,
      data: { employeeId, isActive: employee.isActive },
    });
  } catch (error) {
    console.error("Error in toggleEmployeeStatus:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
    });
  }
};


const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const owner = req.user;

    if (owner.role !== USER_ROLES.OWNER) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
      });
    }

    const employee = await User.findOne({
      where: { id: employeeId, role: USER_ROLES.EMPLOYEE, isDeleted: false },
      attributes: ["id"],
    });

    if (!employee) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Employee not found.",
      });
    }

    employee.isDeleted = true;
    employee.deletedAt = Math.floor(Date.now() / 1000);
    employee.deletedBy = owner.id;
    await employee.save();

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Employee deleted successfully.",
      data: { employeeId },
    });
  } catch (error) {
    console.error("Error in deleteEmployee:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
    });
  }
};

module.exports = {
  createEmployee,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
};
