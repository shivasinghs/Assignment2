const { Admin } = require("../../models/index")
const { BCRYPT, HTTP_STATUS_CODE, ADMIN_ROLES, VALIDATOR,uuidv4, MAIL_TYPES,MAIL_TEMPLATES} = require("../../../config/constants")
const validationRules = require("../../../config/validationRules")
const sendEmail = require("../../helper/mail/send")
const deleteImage = require("../../helper/imageHandler/delete")
const sequelize = require('../../../config/sequelize')

const createSubAdmin = async (req, res) => {
  try {
    // Extract required fields from request body
    const { name, email, password, gender } = req.body;
    const image = req.file;
    const superAdmin = req.admin;
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

    // Validate input data using defined validation rules
    const validation = new VALIDATOR(req.body, {
      name: validationRules.Admin.name,
      email: validationRules.Admin.email,
      password: validationRules.Admin.password,
      gender: validationRules.Admin.gender
    });

    // Return error response if validation fails
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all()
      });
    }

    // Ensure only Super Admins can create Sub-Admins
    if (superAdmin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
        data: "",
        error: ""
      });
    }

    // Prevent Super Admin from creating a Sub-Admin with the same email
    if (email.toLowerCase() === superAdmin.email.toLowerCase()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "You cannot create a Sub-Admin with the same email as the Super Admin.",
        data: "",
        error: ""
      });
    }

    // Check if the email already exists in the database
    const existingAdmin = await Admin.findOne({
      where: { email, isDeleted: false },
      attributes: ["id"]
    });

    // Return an error if the email is already registered
    if (existingAdmin) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Email already exists.",
        data: "",
        error: ""
      });
    }

    let imagePath = null;

    // Handle image upload if provided
    if (image) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

      // Validate file type
      if (!allowedTypes.includes(image.mimetype)) {
        deleteImage(image.path);
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid file type. Only PNG, JPEG, and JPG are allowed.",
          data: null,
          error: null
        });
      }

      // Validate file size (max 2MB)
      if (image.size > 2 * 1024 * 1024) {
        deleteImage(image.path);
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "File size exceeds 2MB limit.",
          data: null,
          error: null
        });
      }

      // Construct the image path URL
      imagePath = baseUrl + image.filename;
    } 

    // Hash the password before storing it in the database
    const hashedPassword = await BCRYPT.hash(password, 10);

    // Create a new Sub-Admin record in the database
    const newSubAdmin = await Admin.create({
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      gender,
      image: imagePath,
      role: ADMIN_ROLES.SUB_ADMIN,
      createdBy: superAdmin.id
    });

    // Send an invitation email to the newly created Sub-Admin
    await sendEmail(
      process.env.EMAIL_FROM,
      newSubAdmin.email,
      MAIL_TYPES.CREATE_SUB_ADMIN,
      MAIL_TEMPLATES.SUB_ADMIN_INVITE,
      {
        name: newSubAdmin.name,
        email: newSubAdmin.email,
        password
      }
    );

    // Return success response with the Sub-Admin ID
    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Sub-Admin created successfully.",
      data: {
        subAdminId: newSubAdmin.id
      },
      error: ""
    });
  } catch (error) {
    // Log error and return a server error response
    console.error("Error in createSubAdmin:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message
    });
  }
};

const getSubAdminById = async (req, res) => {
  try {
    // Extract subAdminId from request parameters
    const { subAdminId } = req.params;
    const superAdmin = req.admin;

    // Validate the subAdminId using  validation rules
    const validation = new VALIDATOR(req.params, {
      subAdminId: validationRules.Admin.id,
    });

    // Return error response if validation fails
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        err: validation.errors.all(),
      });
    }

    // Ensure only Super Admins can view Sub-Admin details
    if (superAdmin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to view admin details.",
        data: "",
        err: null,
      });
    }

    // Query to retrieve Sub-Admin details by id
    const query = `
      SELECT id, name, email, gender, image, role
      FROM admin
      WHERE id = :subAdminId AND is_deleted = false AND role = :subAdminRole AND is_active = true
    `;

    // Execute the query with replacements for dynamic values
    const [subAdmins] = await sequelize.query(query, {
      replacements: { subAdminId, subAdminRole: ADMIN_ROLES.SUB_ADMIN },
      type: sequelize.QueryTypes.SELECT,
    });

    // Return error if no Sub-Admin is found
    if (!subAdmins) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Admin not found.",
        data: "",
        err: null,
      });
    }

    // Return successful response with Sub-Admin details
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Admin details retrieved successfully.",
      data: subAdmins,
      err: null,
    });
  } catch (error) {
    // Log the error and return a server error response
    console.error("Error in getSubAdminById:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
      error: error,
    });
  }
};

const updateSubAdmin = async (req, res) => {
  try {
    // Extract required fields from request body
    const { subAdminId, name, email, gender, removeImage } = req.body;
    const superAdmin = req.admin;
    const image = req.file;
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

    // Validate input using predefined validation rules
    const validation = new VALIDATOR(req.body, {
      subAdminId: validationRules.Admin.id,
      name: validationRules.Admin.name,
      email: validationRules.Admin.email,
      gender: validationRules.Admin.gender,
    });

    // Return error response if validation fails
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Ensure only Super Admins can update Sub-Admins
    if (superAdmin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to update a Sub-Admin.",
        data: "",
        error: "",
      });
    }

    // Prevent setting the Sub-Admin email as the Super Admin's email
    if (email && email.toLowerCase() === superAdmin.email.toLowerCase()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Sub-Admin email cannot be the same as Super Admin's email.",
        data: "",
        error: "",
      });
    }

    // Find the existing Sub-Admin record that is active and not deleted
    const subAdmin = await Admin.findOne({
      where: { id: subAdminId, role: ADMIN_ROLES.SUB_ADMIN, isActive: true, isDeleted: false },
      attributes: ["id", "image"],
    });

    // Return error if Sub-Admin is not found
    if (!subAdmin) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Active Sub-Admin not found or has been deleted.",
        data: "",
        error: "",
      });
    }

    let imagePath = subAdmin.image;

    // Validate and handle the uploaded image
    if (image) {
      //check for allowed type of image
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      
      // Check if the uploaded file type is valid
      if (!allowedTypes.includes(image.mimetype)) {
        deleteImage(image.path);
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid file type. Only PNG, JPEG, and JPG are allowed.",
          data: null,
          error: null,
        });
      }

      // Check if the uploaded file size exceeds the 2MB limit
      if (image.size > 2 * 1024 * 1024) {
        deleteImage(image.path);
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "File size exceeds 2MB limit.",
          data: null,
          error: null,
        });
      }

       // Delete the old image if a new one is uploaded
      if (imagePath) {
        deleteImage(imagePath.replace(baseUrl, ""));
      }
      imagePath = baseUrl + image.filename;
    }

    // If `removeImage` is true, remove the existing image
    if (removeImage === "true" && imagePath) {
      deleteImage(subAdmin.image.replace(baseUrl, ""));
      imagePath = null;
    }

    // Update the Sub-Admin details with the provided values or keep existing ones
    await subAdmin.update({
      name: name || subAdmin.name,
      email: email || subAdmin.email,
      gender: gender || subAdmin.gender,
      image: imagePath,
      updatedAt: Math.floor(Date.now() / 1000),
      updatedBy: superAdmin.id,
    });

    // Return success response with updated Sub-Admin ID
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Sub-Admin updated successfully.",
      data: { subAdminId },
      error: "",
    });
  } catch (error) {
    // Log error and return server error response
    console.error("Error in updateSubAdmin:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};


const toggleSubAdminStatus = async (req, res) => {
  try {
    const { subAdminId } = req.params; // Extract subAdminId from request parameters
    const superAdmin = req.admin; // Get the authenticated admin making the request

    // Validate request parameters using ValidatorJS
    const validation = new VALIDATOR(req.params, {
      subAdminId: validationRules.Admin.id,
    });

    // If validation fails, return a 400 Bad Request response
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Check if the requesting admin is a Super Admin
    if (superAdmin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
        data: "",
        error: "",
      });
    }

    // Find the Sub-Admin in the database
    const subAdmin = await Admin.findOne({
      where: { id: subAdminId, role: ADMIN_ROLES.SUB_ADMIN, isDeleted: false },
      attributes: ["id", "isActive"], // Retrieve only necessary fields
    });

    // If no active Sub-Admin is found, return a 404 Not Found response
    if (!subAdmin) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Sub-Admin not found.",
        data: "",
        error: "",
      });
    }

    // Toggle the isActive status of the Sub-Admin
    subAdmin.isActive = !subAdmin.isActive;
    subAdmin.updatedAt = Math.floor(Date.now() / 1000); // Update timestamp
    subAdmin.updatedBy = superAdmin.id; // Track who made the update
    await subAdmin.save(); // Save the changes to the database

    // Return a success response indicating the updated status
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: `Sub-Admin ${subAdmin.isActive ? "activated" : "deactivated"} successfully.`,
      data: { subAdminId, isActive: subAdmin.isActive },
      error: "",
    });
  } catch (error) {
    console.error("Error in toggleSubAdminStatus:", error); // Log the error for debugging

    // Return a 500 Internal Server Error response in case of an unexpected failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};


const deleteSubAdmin = async (req, res) => {
  try {
    const { subAdminId } = req.params; // Extract subAdminId from request parameters
    const superAdmin = req.admin; // Get the authenticated admin making the request

    // Validate request parameters using ValidatorJS
    const validation = new VALIDATOR(req.params, {
      subAdminId: validationRules.Admin.id,
    });

    // If validation fails, return a 400 Bad Request response
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Check if the requesting admin is a Super Admin
    if (superAdmin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
        data: "",
        error: "",
      });
    }

    // Find the Sub-Admin in the database
    const subAdmin = await Admin.findOne({
      where: { id: subAdminId, role: ADMIN_ROLES.SUB_ADMIN, isDeleted: false },
      attributes: ["id"], // Retrieve only necessary fields
    });

    // If no active Sub-Admin is found, return a 404 Not Found response
    if (!subAdmin) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Sub-Admin not found.",
        data: "",
        error: "",
      });
    }

    // Soft delete the Sub-Admin by updating relevant fields
    subAdmin.isDeleted = true;
    subAdmin.deletedAt = Math.floor(Date.now() / 1000); // Set deletion timestamp
    subAdmin.deletedBy = superAdmin.id; // Track who performed the deletion
    await subAdmin.save(); // Save changes to the database

    // Return a success response confirming deletion
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Sub-Admin deleted successfully.",
      data: { subAdminId },
      error: "",
    });
  } catch (error) {
    console.error("Error in deleteSubAdmin:", error); // Log the error for debugging

    // Return a 500 Internal Server Error response in case of an unexpected failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

module.exports = {
  createSubAdmin,
  getSubAdminById,
  updateSubAdmin,
  toggleSubAdminStatus,
  deleteSubAdmin
}
