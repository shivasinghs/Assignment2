const { Category } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR,Op,uuidv4 } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const deleteImage = require("../../helper/imageHandler/delete");
const sequelize = require('../../../config/sequelize');

const createCategory = async (req, res) => {
  try {
    // Extract category details from request body
    const { itemTypeId, name, description } = req.body;
    const logo = req.file; // Extract uploaded file
    const admin = req.admin; // Extract admin details from request

    // Define base URL for storing uploaded files
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

    // Validate request body using predefined validation rules
    const validation = new VALIDATOR(req.body, {
      name: validationRules.Category.name,
      itemTypeId: validationRules.Category.itemTypeId,
      description: validationRules.Category.description
    });

    // Return error if validation fails
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        err: validation.errors.all()
      });
    }

    // Check if a category with the same name already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      where: { name: { [Op.iLike]: name }, isDeleted: false },
      attributes: ["id"],
    });

    // Return error if category already exists
    if (existingCategory) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Category already exists.",
        data: "",
        error: ""
      });
    }

    let logoPath = null; // Initialize logo path variable
    if (logo) {
      // Define allowed file types
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

      // Validate file type
      if (!allowedTypes.includes(logo.mimetype)) {
        deleteImage(logo.path); // Delete the uploaded file if invalid
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          msg: "Invalid file type. Only PNG, JPEG, and JPG are allowed.",
          data: null,
          err: null
        });
      }

      // Validate file size (max 2MB)
      if (logo.size > 2 * 1024 * 1024) {
        deleteImage(logo.path); // Delete the uploaded file if it exceeds the limit
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          msg: "File size exceeds 2MB limit.",
          data: null,
          err: null
        });
      }

      // Set logo path for storage
      logoPath = baseUrl + logo.filename;
    }

    // Create a new category with validated details
    const newCategory = await Category.create({
      id: uuidv4(),
      name,
      itemTypeId,
      description,
      logo: logoPath,
      createdBy: admin.id
    });

    // Return success response with the new category ID
    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Category created successfully.",
      data: {
        categoryId: newCategory.id
      },
      error: "",
    });

  } catch (error) {
    console.error("Error in createCategory:", error); // Log the error for debugging

    // Return 500 Internal Server Error response in case of failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    // Extract category ID from request parameters
    const { categoryId } = req.params;

    // Validate request parameters using predefined validation rules
    const validation = new VALIDATOR(req.params, {
      categoryId: validationRules.Category.id,
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

    // Fetch category details where the category is neither deleted nor inactive
    const category = await Category.findOne({
      where: { id: categoryId, isDeleted: false, isActive: true },
      attributes: ["name", "description", "itemTypeId", "logo"],
    });

    // Return error response if category is not found
    if (!category) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Category not found.",
        data: "",
        error: "",
      });
    }

    // Return success response with the category details
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Category details retrieved successfully.",
      data: category,
      error: "",
    });
  } catch (error) {
    console.error("Error in getCategoryById:", error); // Log error for debugging

    // Return 500 Internal Server Error response in case of failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};
  
const updateCategory = async (req, res) => {
  try {
    // Extract request parameters
    const { categoryId, name, description, removeLogo } = req.body;
    const logo = req.file; // Uploaded file
    const admin = req.admin; // Authenticated admin
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`; // Base URL for logo storage

    // Validate input using predefined validation rules
    const validation = new VALIDATOR(req.body, {
      categoryId: validationRules.Category.id,
      name: validationRules.Category.name,
      description: validationRules.Category.description
    });

    // Return error if validation fails
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all()
      });
    }

    // Fetch the category to ensure it exists and is not deleted
    const category = await Category.findOne({
      where: { id: categoryId, isDeleted: false },
      attributes: ["id", "logo"]
    });

    // Return error if category is not found
    if (!category) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Category not found.",
        data: "",
        error: null
      });
    }
    
    // Check if a category with the same name (case insensitive) already exists
    const existingCategory = await Category.findOne({
      where: {
        name: { [Op.iLike]: name },
        id: { [Op.ne]: categoryId }, // Exclude current category
        isDeleted: false,
      },
      attributes: ["id"],
    });

    // Return error if category name is already taken
    if (existingCategory) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Category with this name already exists.",
        data: "",
        error: "",
      });
    }

    let logoPath = category.logo;
    // Validate uploaded logo (if provided)
    if (logo) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      
      // Check if the file type is allowed
      if (!allowedTypes.includes(logo.mimetype)) {
        deleteImage(logo.path); // Delete invalid file
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          msg: "Invalid file type. Only PNG, JPEG, and JPG are allowed.",
          data: null,
          err: null
        });
      }

      // Check if file size exceeds the limit (2MB)
      if (logo.size > 2 * 1024 * 1024) {
        deleteImage(logo.path); // Delete oversized file
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          msg: "File size exceeds 2MB limit.",
          data: null,
          err: null
        });
      }
          // If a new logo is uploaded, delete the old one and update the path
      if (logoPath) {
        deleteImage(logoPath.replace(baseUrl, "")); // Remove old logo file
      }
      
      logoPath = baseUrl + logo.filename; // Assign new logo path   
    }

    // If removeLogo is set to "true", delete the existing logo
    if (removeLogo === "true" && logoPath) {
      deleteImage(category.logo.replace(baseUrl, "")); // Delete logo file
      logoPath = null; // Set logo to null
    }

    // Update category details
    await category.update({
      name: name || category.name,
      description: description || category.description,
      logo: logoPath,
      updatedAt: Math.floor(Date.now() / 1000), // Unix timestamp
      updatedBy: admin.id
    });

    // Return success response
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Category updated successfully.",
      data: { categoryId },
      error: "",
    });
  } catch (error) {
    console.error("Error in updateCategory:", error); // Log error for debugging

    // Return 500 Internal Server Error response in case of failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const admin = req.admin; // Authenticated admin performing the deletion
    
    // Validate categoryId format
    const validation = new VALIDATOR(req.params, {
      categoryId: validationRules.Category.id,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data: "",
        error: validation.errors.all(),
      });
    }

    // Check if the category exists and is not already deleted
    const category = await Category.findOne({
      where: { id: categoryId, isDeleted: false },
      attributes: ["id"],
    });

    if (!category) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Category not found.",
        data: "",
        error: "",
      });
    }

    // Soft delete the category
    await category.update({
      isDeleted: true,
      deletedBy: admin.id, // Track who deleted the category
      deletedAt: Math.floor(Date.now() / 1000), // Store deletion timestamp
    });

    // Return success response
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Category deleted successfully.",
      data: "",
      error: "",
    });

  } catch (error) {
    console.error("Error in deleteCategory:", error); // Log error for debugging

    // Return 500 Internal Server Error response in case of failure
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
      // Extract pagination parameters from request query, defaulting to page 1 and pageSize 10
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * pageSize; // Calculate offset for pagination

      // Query to fetch categories with pagination
      const query = `
          SELECT id, name, description, item_type_id, logo
          FROM category
          WHERE is_deleted = false
          ORDER BY created_at ASC
          LIMIT :limit OFFSET :offset
      `;

      // Query to count total number of non-deleted categories
      const countQuery = `
          SELECT COUNT(*) AS totalCategories
          FROM category
          WHERE is_deleted = false
      `;

      // Execute category retrieval query
      const categories = await sequelize.query(query, {
          replacements: { limit: pageSize, offset },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
      });

      // Execute count query to get total number of categories
      const countResult = await sequelize.query(countQuery, {
          type: sequelize.QueryTypes.SELECT,
          raw: true,
      });

      // Extract total category count from the query result
      const totalCategories = Number(countResult[0]?.totalcategories) || 0;

      // Send response with category data and pagination details
      return res.status(HTTP_STATUS_CODE.OK).json({
          status: HTTP_STATUS_CODE.OK,
          message: "Categories retrieved successfully.",
          data: {
              total: totalCategories, // Total count of categories
              categories, // List of retrieved categories
          },
          error: null,
      });
  } catch (error) {
      console.error("Error in getAllCategories:", error);

      // Handle server error and return response
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
          status: HTTP_STATUS_CODE.SERVER_ERROR,
          message: "Internal server error.",
          data: "",
          error: error.message,
      });
  }
};
  

module.exports = {
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getAllCategories,
};
