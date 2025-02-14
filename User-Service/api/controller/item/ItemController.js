const { Item } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const deleteImage = require("../../helper/imageHandler/delete");
const sequelize = require('../../../config/sequelize');


const createItem = async (req, res) => {
    try {
        const { name, description, itemTypeId, categoryId } = req.body;
        const image = req.file;
        const user = req.user; 
        const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

        // Validate input fields using predefined validation rules
        const validation = new VALIDATOR(req.body, {
            name: validationRules.Item.name,
            description: validationRules.Item.description,
            itemTypeId: validationRules.Item.itemTypeId,
            categoryId: validationRules.Item.categoryId,
        });

        // Return error response if validation fails
        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data : "",
                error: validation.errors.all()
            });
        }

        // Check if an item with the same name already exists for the same company
        const existingItem = await Item.findOne({
            where: { name: { [Op.iLike]: name }, isDeleted: false, companyId: user.companyId }, 
            attributes: ["id"],
        });

        // If item already exists, return an error
        if (existingItem) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Item with this name already exists in your company.",
                data : "",
                error: ""
            });
        }

        let imagePath = null;

        // Handle image upload if provided
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

        // Create a new item with the provided details
        const newItem = await Item.create({
            name,
            description,
            image: imagePath,
            itemTypeId,
            categoryId,
            companyId: user.companyId, 
            createdBy: user.id
        });

        // Return success response with the created item's ID
        return res.status(HTTP_STATUS_CODE.CREATED).json({
            status: HTTP_STATUS_CODE.CREATED,
            message: "Item created successfully.",
            data: {
                itemId: newItem.id
            },
            error : ""
        });
    } catch (error) {
        console.error("Error in createItem:", error);

        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data : "",
            error: error.message
        });
    }
};

const getItemById = async (req, res) => {
    try {
        const { itemId } = req.params;
        const user = req.user;

        // Validate itemId parameter
        const validation = new VALIDATOR(req.params, {
            itemId: validationRules.Item.id,
        });

        // Return error response if validation fails
        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data: null,
                error: validation.errors.all(),
            });
        }

        // Select clause: Specifies the fields to retrieve from the item table and related tables 
        let selectClause = `
          SELECT 
                i.id AS "itemId", i.name AS "itemName", 
                i.description AS "itemDescription", i.image AS "itemImage",
                i.item_type_id AS "itemTypeId", it.name AS "itemTypeName",
                i.category_id AS "categoryId", c.name AS "categoryName",
                i.company_id AS "companyId",
                i.created_by AS "createdBy"
          `;

        // From clause: Defines the tables involved and their relationships using LEFT JOINs
        let fromClause = `\n
            FROM item i
            LEFT JOIN company cmp ON i.company_id = cmp.id AND cmp.is_deleted = false
            LEFT JOIN item_type it ON i.item_type_id = it.id AND it.is_deleted = false
            LEFT JOIN category c ON i.category_id = c.id AND c.is_deleted = false
        `;

        // Where clause: Filters results based on item ID, deletion status, company ID, and active status
        let whereClause = `\n
            WHERE i.id = :itemId AND i.is_deleted = false AND i.company_id = :companyId AND i.is_Active = true
        `;

        // Construct final SQL query
        const query = ""
            .concat(selectClause)
            .concat(fromClause)
            .concat(whereClause);

        // Execute query with replacements
        const items = await sequelize.query(query, {
            replacements: { itemId, companyId: user.companyId },
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        // Return item details if found
        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "Item details retrieved successfully.",
            data: items[0],
            error: null,
        });
    } catch (error) {
        console.error("Error in getItemById:", error);

        // Handle server errors
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data: null,
            error: error.message,
        });
    }
};

const updateItem = async (req, res) => {
    try {
        // Extract request body parameters
        const { itemId, name, description, itemTypeId, categoryId, removeImage } = req.body;
        const image = req.file;
        const user = req.user;
        const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

        // Validate input data
        const validation = new VALIDATOR(req.body, {
            itemId: validationRules.Item.id,
            name: validationRules.Item.name,
            description: validationRules.Item.description,
            itemTypeId: validationRules.Item.itemTypeId,
            categoryId: validationRules.Item.categoryId,
        });

        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data: "",
                error: validation.errors.all()
            });
        }

        // Check if the item exists within the user's company
        const item = await Item.findOne({
            where: { id: itemId, isDeleted: false, companyId: user.companyId },
            attributes: ["id", "image"]
        });

        if (!item) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found in your company.",
                data: "",
                error: ""
            });
        }

        // Check if another item with the same name exists in the company
        const existingItem = await Item.findOne({
            where: {
                name: { [Op.iLike]: name },
                id: { [Op.ne]: itemId }, // Exclude the current item from check
                isDeleted: false,
                companyId: user.companyId
            },
            attributes: ["id"],
        });

        if (existingItem) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Item with this name already exists in your company.",
                data: "",
                error: ""
            });
        }

        let imagePath = item.image; // Retain existing image path unless updated

        // Process the uploaded image if provided
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

            // Delete the old image if it exists
            if (imagePath) {
                deleteImage(imagePath.replace(baseUrl, ""));
            }

            // Set new image path
            imagePath = baseUrl + image.filename;
        }

        // Remove image if requested
        if (removeImage === "true" && imagePath) {
            deleteImage(item.image.replace(baseUrl, ""));
            imagePath = null;
        }

        // Update the item details
        await item.update({
            name: name || item.name,
            description: description || item.description,
            image: imagePath,
            itemTypeId: itemTypeId || item.itemTypeId,
            categoryId: categoryId || item.categoryId,
            updatedAt: Math.floor(Date.now() / 1000),
            updatedBy: user.id
        });

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "Item updated successfully.",
            data: { itemId },
            error: ""
        });
    } catch (error) {
        console.error("Error in updateItem:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data: "",
            error: error.message
        });
    }
};

const deleteItem = async (req, res) => {
    try {
        // Extract itemId from request parameters
        const { itemId } = req.params; 

        // Get logged-in user details
        const user = req.user; 

        // Validate itemId format
        const validation = new VALIDATOR(req.params, {
            itemId: validationRules.Item.id,
        });

        //If Validation Fails return a error response
        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data : "",
                error: validation.errors.all(),
            });
        }

        // Check if the item exists and belongs to the user's company
        const item = await Item.findOne({
            where: { id: itemId, isDeleted: false, companyId: user.companyId },
            attributes: ["id"]
        });

        // If item is not found, return an error response
        if (!item) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found in your company.",
                data : "",
                error: ""
            });
        }

        // Perform a soft delete by updating isDeleted flag and setting deletedBy & deletedAt timestamps
        await item.update({
            isDeleted: true,
            deletedBy: user.id,
            deletedAt: Math.floor(Date.now() / 1000),
        });

        // Return success response
        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "Item deleted successfully.",
            data : "",
            error: ""
        });
    } catch (error) {
        console.error("Error in deleteItem:", error);

        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data : "",
            error: error.message,
        });
    }
};

const getAllItems = async (req, res) => {
    try {
        const user = req.user; // Extract the authenticated user from the request
        const page = parseInt(req.query.page) || 1; // Get the page number from query params, default to 1
        const pageSize = parseInt(req.query.limit) || 10; // Get the page size from query params, default to 10
        const offset = (page - 1) * pageSize; // Calculate the offset for pagination

        // Define the SELECT clause with required fields
        let selectClause = `
            SELECT 
                i.id, i.name, i.description, i.image, 
                i.item_type_id AS "itemTypeId", it.name AS "itemTypeName",
                i.category_id AS "categoryId", c.name AS "categoryName",
                i.company_id AS "companyId"
        `;

        // Define FROM clause with necessary table joins
        let fromClause = `
            FROM item i
            LEFT JOIN item_type it ON i.item_type_id = it.id AND it.is_deleted = false
            LEFT JOIN category c ON i.category_id = c.id AND c.is_deleted = false
            LEFT JOIN company cmp ON i.company_id = cmp.id AND cmp.is_deleted = false
        `;

        // Define WHERE clause to filter out deleted and inactive items
        let whereClause = `
            WHERE i.is_deleted = false AND i.company_id = :companyId AND i.is_Active = true
        `;

        // Define ORDER BY clause to sort items by creation date in ascending order
        let orderByClause = `
            ORDER BY i.created_at ASC
        `;

        // Combine all query parts into a final query string
        const query = ""
            .concat(selectClause)
            .concat(fromClause)
            .concat(whereClause)
            .concat(` ${orderByClause} LIMIT :limit OFFSET :offset`);

        // Query to count the total number of items for pagination
        const countQuery = `
            SELECT COUNT(id) AS "totalItems"
            FROM item
            WHERE is_deleted = false AND company_id = :companyId
        `;

        // Execute the main query to fetch paginated items
        const items = await sequelize.query(query, {
            replacements: { limit: pageSize, offset, companyId: user.companyId },
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        // Execute the count query to get the total number of items
        const countResult = await sequelize.query(countQuery, {
            replacements: { companyId: user.companyId },
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        // Extract the total number of items from the count query result
        const totalItems = Number(countResult[0]?.totalItems) || 0;

        // Return the response with paginated items and total count
        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: totalItems > 0 ? "Items retrieved successfully." : "No items found in your company.",
            total: totalItems,
            data: items,
            error: null,
        });
    } catch (error) {
        // Handle any unexpected errors
        console.error("Error in getAllItems:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data: null,
            error: error.message,
        });
    }
};

module.exports = {
    createItem,
    getItemById,
    updateItem,
    deleteItem,
    getAllItems,
};