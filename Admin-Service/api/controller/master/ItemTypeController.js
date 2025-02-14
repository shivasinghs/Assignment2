const { ItemType } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, Op,uuidv4 } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require("../../../config/sequelize");

const createItemType = async (req, res) => {
  try {
    // Extract item type details from the request body
    const { name, description } = req.body;
    const admin = req.admin; // Get admin details from request context

    // Validate request body against predefined validation rules
    const validation = new VALIDATOR(req.body, {
      name: validationRules.ItemType.name,
      description: validationRules.ItemType.description,
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

    // Check if an item type with the same name already exists (case insensitive)
    const existingItemType = await ItemType.findOne({
      where: { name: { [Op.iLike]: name }, isDeleted: false },
      attributes: ["id"],
    });

    // If an item type already exists, return a 400 Bad Request response
    if (existingItemType) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Item Type already exists.",
        data: "",
        error: "",
      });
    }

    // Create a new item type in the database
    const newItemType = await ItemType.create({
      id: uuidv4(), // Generate a unique UUID for the new item type
      name,
      description,
      createdBy: admin.id, // Store admin ID who created this item type
    });

    // Return a success response with the newly created item type ID
    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Item Type created successfully.",
      data: { itemTypeId: newItemType.id },
      error: "",
    });
  } catch (error) {
    console.error("Error in createItemType:", error);

    // Handle server errors and return a 500 Internal Server Error response
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const getItemTypeById = async (req, res) => {
  try {
    // Extract itemTypeId from request parameters
    const { itemTypeId } = req.params;

    // Validate the itemTypeId using predefined validation rules
    const validation = new VALIDATOR(req.params, {
      itemTypeId: validationRules.ItemType.id,
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

    // Query the database to find the item type by ID, ensuring it's not deleted and is active
    const itemType = await ItemType.findOne({
      where: { id: itemTypeId, isDeleted: false, isActive: true },
      attributes: ["name", "description"], // Retrieve only necessary fields
    });

    // If item type is not found, return a 404 Not Found response
    if (!itemType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Item Type not found.",
        data: "",
        error: "",
      });
    }

    // Return a success response with the retrieved item type details
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Item Type details retrieved successfully.",
      data: itemType,
      error: "",
    });
  } catch (error) {
    console.error("Error in getItemTypeById:", error);

    // Handle server errors and return a 500 Internal Server Error response
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const updateItemType = async (req, res) => {
  try {
    // Extract required fields from request body
    const { itemTypeId, name, description } = req.body;
    const admin = req.admin; // Get admin details from request

    // Validate request body using predefined validation rules
    const validation = new VALIDATOR(req.body, {
      itemTypeId: validationRules.ItemType.id,
      name: validationRules.ItemType.name,
      description: validationRules.ItemType.description
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

    // Check if the item type exists and is not deleted
    const itemType = await ItemType.findOne({
      where: { id: itemTypeId, isDeleted: false },
      attributes: ["id"],
    });

    // If item type is not found, return a 404 Not Found response
    if (!itemType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Item Type not found.",
        data: "",
        error: ""
      });
    }

    // Check if an item type with the same name already exists (excluding the current one)
    const existingItemType = await ItemType.findOne({
      where: {
        name: { [Op.iLike]: name }, 
        id: { [Op.ne]: itemTypeId }, // Exclude current itemTypeId
        isDeleted: false,
      },
      attributes: ["id"],
    });

    // If an item type with the same name exists, return a 400 Bad Request response
    if (existingItemType) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Item Type with this name already exists.",
        data: "",
        error: ""
      });
    }

    // Update the item type with new details
    await itemType.update({ 
      name, 
      description, 
      updatedBy: admin.id,
      updatedAt: Math.floor(Date.now() / 1000), // Store timestamp in seconds
    });

    // Return success response with updated itemTypeId
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Item Type updated successfully.",
      data: { itemTypeId },
      error: ""
    });
  } catch (error) {
    console.error("Error in updateItemType:", error);

    // Handle server errors and return a 500 Internal Server Error response
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const deleteItemType = async (req, res) => {
  try {
    // Extract itemTypeId from request parameters
    const { itemTypeId } = req.params;
    const admin = req.admin; // Get admin details from request

    // Validate request parameters using predefined validation rules
    const validation = new VALIDATOR(req.params, {
      itemTypeId: validationRules.ItemType.id,
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

    // Check if the item type exists and is not already deleted
    const itemType = await ItemType.findOne({
      where: { id: itemTypeId, isDeleted: false },
      attributes: ["id"], // Retrieve only necessary fields
    });

    // If item type is not found, return a 404 Not Found response
    if (!itemType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Item Type not found.",
        data: "",
        error: "",
      });
    }

    // Soft delete the item type by updating isDeleted flag and setting timestamps
    await itemType.update({
      isDeleted: true,
      deletedBy: admin.id,
      deletedAt: Math.floor(Date.now() / 1000), // Store timestamp in seconds
    });

    // Return success response
    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Item Type deleted successfully.",
      data: "",
      error: "",
    });
  } catch (error) {
    console.error("Error in deleteItemType:", error);

    // Handle server errors and return a 500 Internal Server Error response
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: "",
      error: error.message,
    });
  }
};

const getAllItemTypes = async (req, res) => {
  try {
      // Extract pagination parameters from query, with default values
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * pageSize; // Calculate offset for pagination

      // SQL query to fetch item types with pagination, filtering out deleted records
      const query = `
          SELECT id, name, description
          FROM item_type
          WHERE is_deleted = false
          ORDER BY created_at ASC
          LIMIT :limit OFFSET :offset
      `;

      // SQL query to count the total number of item types (excluding deleted ones)
      const countQuery = `
          SELECT COUNT(*) AS totalItemTypes
          FROM item_type
          WHERE is_deleted = false
      `;

      // Execute the query to get the list of item types
      const itemTypes = await sequelize.query(query, {
        replacements: { limit: pageSize, offset }, // Inject pagination values
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });

      // Execute the query to get the total count of item types
      const countResult = await sequelize.query(countQuery, {
          type: sequelize.QueryTypes.SELECT,
          raw: true,
      });

      // Extract total count from query result
      const totalItemTypes = Number(countResult[0]?.totalitemtypes) || 0;

      // Return a successful response with item type data and pagination details
      return res.status(HTTP_STATUS_CODE.OK).json({
          status: HTTP_STATUS_CODE.OK,
          message: "Item Types retrieved successfully.",
          total: totalItemTypes, // Total number of item types
          data: { itemTypes }, // Retrieved item types
          error: null,
      });
  } catch (error) {
      console.error("Error in getAllItemTypes:", error);

      // Handle server errors and return a 500 Internal Server Error response
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
          status: HTTP_STATUS_CODE.SERVER_ERROR,
          message: "Internal server error.",
          data: "",
          error: error.message,
      });
  }
};


module.exports = {
  createItemType,
  getItemTypeById,
  updateItemType,
  deleteItemType,
  getAllItemTypes,
};
