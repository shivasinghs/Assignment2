const { User } = require("../../models/index"); 
const {  HTTP_STATUS_CODE, USER_ROLES, VALIDATOR } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const deleteImage = require("../../helper/imageHandler/delete");


const updateEmployee = async (req, res) => {
    try {
      const { name, gender, phone, removeImage } = req.body;
      const employeeId = req.user.id; 
      const image = req.file;
      const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;
       
      const validation = new VALIDATOR(req.body, {
        name: validationRules.User.name,
        gender: validationRules.User.gender,
        phone: validationRules.User.phone,
      });
  
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid input.",
          err: validation.errors.all(),
        });
      }

      const employee = await User.findOne({
        where: { id: employeeId, role: USER_ROLES.EMPLOYEE, isActive: true, isDeleted: false },
        attributes: ["id", "name", "gender", "phone", "profileImage"],
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
        profileImage: imagePath,
        updatedAt: Math.floor(Date.now() / 1000),
      });
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Employee details updated successfully.",
        data: { employeeId: employee.id },
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

  const getEmployee = async (req, res) => {
    try {
      const employeeId = req.user.id; 
      const employee = await User.findOne({
        where: { 
          id: employeeId, 
          role: USER_ROLES.EMPLOYEE, 
          isActive: true, 
          isDeleted: false 
        },
        attributes: ["id", "name","email", "gender", "phone", "profileImage"],
      });
  
      if (!employee) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "Employee not found or has been deleted.",
        });
      }
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Employee details retrieved successfully.",
        data: {
         employee 
        },
      });
    } catch (error) {
      console.error("Error in getEmployee:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        err: error.message,
      });
    }
  };
  

  module.exports = {updateEmployee, getEmployee}
  