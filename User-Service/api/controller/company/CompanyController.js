const { Company } = require("../../models/index"); 
const { HTTP_STATUS_CODE, USER_ROLES, VALIDATOR } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const deleteImage = require("../../helper/imageHandler/delete");

const updateCompany = async (req, res) => {
  try {
    // Extract request data
    const { companyId, name, description, removeLogo } = req.body;
    const owner = req.user;
    const logo = req.file;
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

    // Validate request body using predefined validation rules
    const validation = new VALIDATOR(req.body, {
      companyId: validationRules.Company.id,
      name: validationRules.Company.name,
      description: validationRules.Company.description,
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

    // Check if the user has the required owner role
    if (owner.role !== USER_ROLES.OWNER) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to update this company's details.",
        data: "",
        error: "",
      });
    }

    // Fetch company details based on the provided company ID
    const company = await Company.findOne({
      where: { id: companyId, ownerId: owner.id, isActive: true, isDeleted: false },
    });

    // Return error response if the company is not found or the user is not the owner
    if (!company) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Company not found or has been deleted or you don't own it.",
        data: "",
        error: "",
      });
    }

    let logoPath = company.logo;

    // Validate uploaded logo (if provided)
    if (logo) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      
      // Check if the file type is allowed
      if (!allowedTypes.includes(logo.mimetype)) {
        deleteImage(logo.path); // Delete invalid file
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid file type. Only PNG, JPEG, and JPG are allowed.",
          data: null,
          error: null
        });
      }

      // Check if file size exceeds the limit (2MB)
      if (logo.size > 2 * 1024 * 1024) {
        deleteImage(logo.path); // Delete oversized file
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "File size exceeds 2MB limit.",
          data: null,
          error: null
        });
      }

      // Remove the old logo if a new one is uploaded
      if (logoPath) {
        deleteImage(logoPath.replace(baseUrl, ""));
      }
      logoPath = baseUrl + logo.filename;
    }

    // Remove the existing logo if requested
    if (removeLogo === "true" && logoPath) {
      deleteImage(company.logo.replace(baseUrl, ""));
      logoPath = null;
    }

    // Update the company details in the database
    await company.update({
      name: name || company.name,
      description: description || company.description,
      logo: logoPath,
      updatedAt: Math.floor(Date.now() / 1000),
      updatedBy: owner.id,
    });

    // Return success response
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Company updated successfully.",
      data: { companyId },
      error: "",
    });
  } catch (error) {
    console.error("Error in updateCompany:", error);
    
    // Handle internal server error
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const getCompany = async (req, res) => {
  try {
    // Extract companyId from request parameters and owner details from authenticated user
    const { companyId } = req.params;
    const owner = req.user;

    // Validate companyId from request parameters instead of body
    const validation = new VALIDATOR(req.params, {
      companyId: validationRules.Company.id,
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

    // Fetch company details that belong to the authenticated owner
    const company = await Company.findOne({
      where: { id: companyId, ownerId: owner.id, isActive: true, isDeleted: false },
      attributes: ["id", "name", "description", "logo"], // Select only required fields
    });

    // Return error response if no company is found
    if (!company) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Company not found or has been deleted.",
        data: "",
        error: "",
      });
    }

    // Return success response with company details
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Company details retrieved successfully.",
      data: company,
      error: "",
    });
  } catch (error) {
    console.error("Error in getCompany:", error);

    // Handle internal server error
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};


module.exports = { updateCompany, getCompany };
