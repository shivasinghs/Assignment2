const { User } = require("../../models/index"); 
const { HTTP_STATUS_CODE, USER_ROLES, VALIDATOR } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const deleteImage = require("../../helper/imageHandler/delete");

const updateEmployee = async (req, res) => {
    try {
      //Extract field from request body
      const { name, gender, phone, removeImage } = req.body;
      const employeeId = req.user.id; // Get employee ID from authenticated user
      const image = req.file;
      const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;
       
      // Validate input fields
      const validation = new VALIDATOR(req.body, {
        name: validationRules.User.name,
        gender: validationRules.User.gender,
        phone: validationRules.User.phone,
      });
  
      //If validation fails return a error response
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid input.",
          data: "",
          error: validation.errors.all(),
        });
      }

      // Fetch the employee details
      const employee = await User.findOne({
        where: { id: employeeId, role: USER_ROLES.EMPLOYEE, isActive: true, isDeleted: false },
        attributes: ["id", "name", "gender", "phone", "profileImage"],
      });
  
      //If employee not found return a response 
      if (!employee) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "Employee not found or has been deleted.",
          data: "",
          error: ""
        });
      }
      
      let imagePath = employee.profileImage;

      // Handle profile image update
      if (image) {

        //check for allowed type of image input
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

        if (imagePath) {
          deleteImage(imagePath.replace(baseUrl, "")); // Delete old profile image
        }

        // Set new image path
        imagePath = baseUrl + image.filename; 
      }

      // Handle profile image removal if requested
      if (removeImage === "true" && imagePath) {
        deleteImage(employee.profileImage.replace(baseUrl, ""));
        imagePath = null;
      }

      // Update employee details
      await employee.update({
        name: name || employee.name,
        gender: gender || employee.gender,
        phone: phone || employee.phone,
        profileImage: imagePath,
        updatedAt: Math.floor(Date.now() / 1000),
      });
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Employee details updated successfully.",
        data: { employeeId: employee.id },
        error: ""
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

const getEmployee = async (req, res) => {
  try {
    const employeeId = req.user.id; // Get employee ID from authenticated user
    
    // Fetch employee details from the database
    const employee = await User.findOne({
      where: { 
        id: employeeId, 
        role: USER_ROLES.EMPLOYEE, 
        isActive: true, 
        isDeleted: false 
      },
      attributes: ["id", "name", "email", "gender", "phone", "profileImage"], // Select specific fields
    });

    // If employee does not exist, return a 404 response
    if (!employee) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Employee not found or has been deleted.",
        data: "",
        error: ""
      });
    }

    // Return success response with employee details
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Employee details retrieved successfully.",
      data: {
       employee 
      },
      error: ""
    });
  } catch (error) {
    console.error("Error in getEmployee:", error);
    
    // Handle internal server error
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};
  
module.exports = { updateEmployee, getEmployee };
