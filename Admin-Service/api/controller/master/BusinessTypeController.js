const { BusinessType,Admin } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR,Op,uuidv4 } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require('../../../config/sequelize')

const createBusinessType = async (req, res) => {
  try {
    const { name } = req.body; // Extract the business type name from the request body
    const admin = req.admin; // Get the authenticated admin making the request

    // Validate request body using ValidatorJS
    const validation = new VALIDATOR(req.body, {
      name: validationRules.BusinessType.name,
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

    // Check if a business type with the same name (case-insensitive) already exists
    const existingBusinessType = await BusinessType.findOne({ 
      where: { name: { [Op.iLike]: name }, isDeleted: false }, // Case-insensitive check
      attributes: ["id"], // Retrieve only the ID for efficiency
    });

    // If a duplicate business type exists, return a 400 Bad Request response
    if (existingBusinessType) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Business Type already exists.",
        data: "",
        error: "",
      });
    }

    // Create a new business type entry in the database
    const newBusinessType = await BusinessType.create({
      id: uuidv4(), // Generate a unique ID for the new business type
      name,
      createdBy: admin.id, // Track the admin who created it
    });

    // Return a success response with the new business type ID
    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Business Type created successfully.",
      data: { businessTypeId: newBusinessType.id },
      error: "",
    });
  } catch (error) {
    console.error("Error in createBusinessType:", error); // Log the error for debugging

    // Return a 500 Internal Server Error response in case of an unexpected failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const getBusinessTypeById = async (req, res) => {
  try {
    const { businessTypeId } = req.params; // Extract the business type ID from request parameters

    // Validate request parameters using ValidatorJS
    const validation = new VALIDATOR(req.params, {
      businessTypeId: validationRules.BusinessType.id,
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

    // Fetch the business type from the database
    const businessType = await BusinessType.findOne({
      where: { id: businessTypeId, isDeleted: false, isActive: true }, // Ensure it's not deleted and active
      attributes: ["name"], // Retrieve only the name field for efficiency
    });

    // If no business type is found, return a 404 Not Found response
    if (!businessType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Business Type not found.",
        data: "",
        error: "",
      });
    }

    // Return a success response with the business type details
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Business Type details retrieved successfully.",
      data: businessType,
      error: "",
    });
  } catch (error) {
    console.error("Error in getBusinessTypeById:", error); // Log the error for debugging

    // Return a 500 Internal Server Error response in case of an unexpected failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const updateBusinessType = async (req, res) => {
  try {
    const { businessTypeId, name } = req.body; // Extract business type ID and name from request body
    const admin = req.admin; // Get the admin making the request
  
    // Validate request body using ValidatorJS
    const validation = new VALIDATOR(req.body, {
      businessTypeId: validationRules.BusinessType.id,
      name: validationRules.BusinessType.name,
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

    // Fetch the business type from the database
    const businessType = await BusinessType.findOne({
      where: { id: businessTypeId, isDeleted: false }, // Ensure the business type exists and is not deleted
      attributes: ["id"],
    });

    // If business type not found, return a 404 Not Found response
    if (!businessType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Business Type not found.",
        data: "",
        error: "",
      });
    }

    // Check if a business type with the same name already exists (excluding the current one)
    const existingBusinessType = await BusinessType.findOne({
      where: {
        name: { [Op.iLike]: name }, // Case-insensitive check for name
        id: { [Op.ne]: businessTypeId }, // Exclude the current business type
        isDeleted: false,
      },
      attributes: ["id"],
    });

    // If a business type with the same name exists, return a 400 Bad Request response
    if (existingBusinessType) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Business Type with this name already exists.",
        data: "",
        error: "",
      });
    }

    // Update business type details
    await businessType.update({
      name: name,
      updatedBy: admin.id, // Store the admin ID who performed the update
      updatedAt: Math.floor(Date.now() / 1000), // Store the update timestamp
    });

    // Return a success response
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Business Type updated successfully.",
      data: { businessTypeId: businessTypeId },
      error: "",
    });
  } catch (error) {
    console.error("Error in updateBusinessType:", error); // Log the error for debugging

    // Return a 500 Internal Server Error response in case of an unexpected failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};
  
const deleteBusinessType = async (req, res) => {
  try {
    const { businessTypeId } = req.params; // Extract business type ID from request parameters
    const admin = req.admin; // Get the admin performing the deletion
    
    // Validate request parameters using ValidatorJS
    const validation = new VALIDATOR(req.params, {
      businessTypeId: validationRules.BusinessType.id,
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

    // Check if the business type exists and is not already deleted
    const businessType = await BusinessType.findOne({
      where: { id: businessTypeId, isDeleted: false },
      attributes: ["id"],
    });

    // If business type is not found, return a 404 Not Found response
    if (!businessType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Business Type not found.",
        data: "",
        error: "",
      });
    }

    // Perform a soft delete by updating the isDeleted flag and setting deleted metadata
    await businessType.update({
      isDeleted: true,
      deletedBy: admin.id, // Store the admin ID who performed the deletion
      deletedAt: Math.floor(Date.now() / 1000), // Store the deletion timestamp
    });

    // Return a success response
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Business Type deleted successfully.",
      data: { businessTypeId: businessTypeId },
      error: "",
    });
  } catch (error) {
    console.error("Error in deleteBusinessType:", error); // Log the error for debugging

    // Return a 500 Internal Server Error response in case of an unexpected failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const getAllBusinessTypes = async (req, res) => {
  try {  
    // Extract pagination parameters from query string, defaulting to page 1 and pageSize 10
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * pageSize;

    // Query to fetch business types with pagination
    const query = `
      SELECT id AS "businessTypeId", name 
      FROM business_type
      WHERE is_deleted = false 
      ORDER BY created_at ASC
      LIMIT :limit OFFSET :offset
    `;

    // Query to count total number of business types
    const countQuery = `
      SELECT COUNT(id) AS "totalBusinessTypes"
      FROM business_type
      WHERE is_deleted = false
    `;

    // Execute the business type query with pagination
    const businessTypes = await sequelize.query(query, {
      replacements: { limit: pageSize, offset },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    // Execute the count query to get the total number of business types
    const countResult = await sequelize.query(countQuery, {
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    // Extract total count from the result
    const totalBusinessTypes = Number(countResult[0]?.totalBusinessTypes) || 0;

    // Return successful response with retrieved business types and total count
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Business Types retrieved successfully.",
      total: totalBusinessTypes,
      data: { businessTypes },
      error: null,
    });

  } catch (error) {
    console.error("Error in getAllBusinessTypes:", error); // Log the error for debugging

    // Return 500 Internal Server Error response in case of failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

module.exports = {
  createBusinessType,
  getBusinessTypeById,
  updateBusinessType,
  deleteBusinessType,
  getAllBusinessTypes,
};
