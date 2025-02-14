const { User,Company } = require("../../models/index"); 
const { BCRYPT, HTTP_STATUS_CODE, USER_ROLES, VALIDATOR,MAIL_TYPES,MAIL_TEMPLATES } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sendEmail = require("../../helper/mail/send");
const deleteImage = require("../../helper/imageHandler/delete");
// const sequelize = require('../../../../config/sequelize');

const createEmployee = async (req, res) => {
  try {
    const { name, gender, phone, email, password, companyId } = req.body;
    const image = req.file;
    const owner = req.user;
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

    // Validate request body fields using predefined validation rules
    const validation = new VALIDATOR(req.body, {
      name: validationRules.User.name,
      email: validationRules.User.email,
      password: validationRules.User.password,
      gender: validationRules.User.gender,
      phone: validationRules.User.phone,
      companyId: validationRules.User.companyId,
    });

    // Return error if validation fails
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Ensure only owners can create employees
    if (owner.role !== USER_ROLES.OWNER) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
        data: "",
        error: "",
      });
    }

    // Prevent the owner from creating an employee with their own email
    if (email.toLowerCase() === owner.email.toLowerCase()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "You cannot create an employee with the same email as the owner.",
        data: "",
        error: "",
      });
    }

    // Check if an employee with the same email already exists
    const existingEmployee = await User.findOne({
      where: { email, isDeleted: false },
      attributes: ['id'],
    });

    if (existingEmployee) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Email already exists.",
        data: "",
        error: "",
      });
    }

    // Verify if the company exists and is owned by the current owner
    const existingCompany = await Company.findOne({
      where: { id: companyId, ownerId: owner.id, isDeleted: false },
      attributes: ['id'],
    });

    if (!existingCompany) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Company not found or you do not have permission to assign employees to this company.",
        data: "",
        error: "",
      });
    }

    let imagePath = null;

    if (image) {
      // Check for allowed image types
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(image.mimetype)) {
        deleteImage(image.path); // Delete invalid file
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid file type. Only PNG, JPEG, and JPG are allowed.",
          data: null,
          error: null,
        });
      }

      // Validate file size (max 2MB)
      if (image.size > 2 * 1024 * 1024) {
        deleteImage(image.path); // Delete oversized file
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "File size exceeds 2MB limit.",
          data: null,
          error: null,
        });
      }

      // Set new image path
      imagePath = baseUrl + image.filename;
    }

    // Hash the password before storing it
    const hashedPassword = await BCRYPT.hash(password, 10);

    // Create the new employee in the database
    const newEmployee = await User.create({
      name,
      email,
      password: hashedPassword,
      gender,
      phone,
      profileImage: imagePath,
      role: USER_ROLES.EMPLOYEE,
      companyId,
      isVerified: true,
      createdBy: owner.id,
    });

    // Send email invitation to the new employee
    await sendEmail(
      process.env.EMAIL_FROM,
      newEmployee.email,
      MAIL_TYPES.CREATE_EMPLOYEE,
      MAIL_TEMPLATES.EMPLOYEE_INVITE,
      {
        name: newEmployee.name,
        email: newEmployee.email,
        password,
      }
    );

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Employee created successfully.",
      data: { EmployeeId: newEmployee.id },
      error: "",
    });
  } catch (error) {
    console.error("Error in createEmployee:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const owner = req.user;

    // Validate request parameters
    const validation = new VALIDATOR(req.params, {
      employeeId: validationRules.User.id,
    });

    // Return error if validation fails
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Ensure only owners can retrieve employee details
    if (owner.role !== USER_ROLES.OWNER) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to view this employee's details.",
        data: "",
        error: "",
      });
    }

    // Fetch the employee details from the database
    const employee = await User.findOne({
      where: { id: employeeId, role: USER_ROLES.EMPLOYEE, isDeleted: false, isActive: true,companyId : owner.companyId },
      attributes: ["id", "name", "email", "gender", "phone", "profileImage", "role"],
    });

    // Return error if the employee is not found
    if (!employee) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Employee not found.",
        data: "",
        error: "",
      });
    }

    // Return the employee details
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Employee details retrieved successfully.",
      data: employee,
      error: "",
    });
  } catch (error) {
    console.error("Error in getEmployeeById:", error);
    
    // Handle any server errors
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { employeeId, name, gender, phone, email, removeImage } = req.body;
    const owner = req.user;
    const image = req.file;
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

    // Validate input fields
    const validation = new VALIDATOR(req.body, {
      employeeId: validationRules.User.id,
      name: validationRules.User.name,
      gender: validationRules.User.gender,
      phone: validationRules.User.phone,
      email: validationRules.User.email, 
    });

    // Return validation errors if input is invalid
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Check if the requester is an owner
    if (owner.role !== USER_ROLES.OWNER) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to update this employee's details.",
        data: "",
        error: ""
      });
    }

    // Prevent updating employee email to the same as the owner's email
    if (email && email.toLowerCase() === owner.email.toLowerCase()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "You cannot update the employee's email to be the same as the owner's email.",
        data: "",
        error: "",
      });
    }

    // Fetch employee details
    const employee = await User.findOne({
      where: { id: employeeId, role: USER_ROLES.EMPLOYEE, isActive: true, isDeleted: false,companyId : owner.companyId },
      attributes: ["id", "profileImage", "email"],
    });

    // Return error if employee is not found
    if (!employee) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Employee not found or has been deleted.",
        data: "",
        error: "",
      });
    }

    let imagePath = employee.profileImage;

    // Process profile image if provided
    if (image) {
      // Check for allowed image types
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(image.mimetype)) {
        deleteImage(image.path); // Delete invalid file
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid file type. Only PNG, JPEG, and JPG are allowed.",
          data: null,
          error: null
        });
      }

      // Validate file size (max 2MB)
      if (image.size > 2 * 1024 * 1024) { 
        deleteImage(image.path); // Delete oversized file
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "File size exceeds 2MB limit.",
          data: null,
          error: null
        });
      }

      // Delete the old profile image if exists
      if (imagePath) {
        deleteImage(imagePath.replace(baseUrl, ""));
      }

      // Set new image path
      imagePath = baseUrl + image.filename; 
    }

    // Remove profile image if requested
    if (removeImage === "true" && imagePath) {
      deleteImage(employee.profileImage.replace(baseUrl, ""));
      imagePath = null;
    }

    // Update employee details in the database
    await employee.update({
      name: name || employee.name,
      gender: gender || employee.gender,
      phone: phone || employee.phone,
      email: email || employee.email, 
      profileImage: imagePath,
      updatedAt: Math.floor(Date.now() / 1000),
      updatedBy: owner.id,  
    });

    // Return success response
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Employee updated successfully.",
      data: { employeeId },
      error: "",
    });
  } catch (error) {
    console.error("Error in updateEmployee:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};
  
const toggleEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const owner = req.user;

    // Check if the requester is an owner
    if (owner.role !== USER_ROLES.OWNER) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
        data: "",
        error: "",
      });
    }

    // Fetch the employee record based on the provided ID
    const employee = await User.findOne({
      where: { id: employeeId, role: USER_ROLES.EMPLOYEE, isDeleted: false,companyId : owner.companyId },
      attributes: ["id", "isActive"],
    });

    // Return error if employee is not found
    if (!employee) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Employee not found.",
        data: "",
        error: "",
      });
    }

    // Toggle the employee's active status
    employee.isActive = !employee.isActive;
    employee.updatedAt = Math.floor(Date.now() / 1000);
    employee.updatedBy = owner.id;

    // Save the updated employee record
    await employee.save();

    // Return success response with updated employee status
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: `Employee ${employee.isActive ? "activated" : "deactivated"} successfully.`,
      data: { employeeId, isActive: employee.isActive },
      error: "",
    });
  } catch (error) {
    console.error("Error in toggleEmployeeStatus:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const owner = req.user;

    // Check if the requester is an owner
    if (owner.role !== USER_ROLES.OWNER) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
        data: "",
        error: "",
      });
    }

    // Fetch the employee record based on the provided ID
    const employee = await User.findOne({
      where: { id: employeeId, role: USER_ROLES.EMPLOYEE, isDeleted: false, companyId: owner.companyId },
      attributes: ["id"],
    });

    // Return error if the employee is not found
    if (!employee) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Employee not found.",
        data: "",
        error: "",
      });
    }

    // Soft delete the employee by updating the isDeleted flag and deletion timestamp
    employee.isDeleted = true;
    employee.deletedAt = Math.floor(Date.now() / 1000);
    employee.deletedBy = owner.id;

    // Save the updated employee record
    await employee.save();

    // Return success response after deletion
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Employee deleted successfully.",
      data: { employeeId },
      error: "",
    });
  } catch (error) {
    console.error("Error in deleteEmployee:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
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
