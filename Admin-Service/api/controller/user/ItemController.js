const { Item } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require("../../../config/sequelize");

const updateItem = async (req, res) => {
    try {
        // Extract item details from request body
        const { itemId, name, description, itemTypeId, categoryId, companyId } = req.body;
        const adminId = req.admin.id; // Get admin ID from authenticated admin

        // Validate request input using predefined validation rules
        const validation = new VALIDATOR(req.body, {
            itemId: validationRules.Item.id,
            name: validationRules.Item.name,
            description: validationRules.Item.description,
            itemTypeId: validationRules.Item.itemTypeId,
            categoryId: validationRules.Item.categoryId,
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

        // Check if an item with the same name already exists in the given company
        const existingItem = await Item.findOne({
            where: {
                name: { [Op.iLike]: name }, // Case-insensitive check
                id: { [Op.ne]: itemId }, // Exclude the item being updated
                isDeleted: false,
                companyId, // Ensure item belongs to the specified company
            },
            attributes: ["id"],
        });

        // If an item with the same name exists, return a 400 Bad Request response
        if (existingItem) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Item with this name already exists.",
                data: "",
                error: "",
            });
        }

        // Fetch the item to be updated, ensuring it is not deleted and is active
        const item = await Item.findOne({
            where: { id: itemId, isDeleted: false, isActive: true },
            attributes: ["id"],
        });

        // If the item does not exist, return a 404 Not Found response
        if (!item) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found.",
                data: "",
                error: "",
            });
        }

        // Update the item with new values or retain existing ones if not provided
        await item.update({
            name: name || item.name,
            description: description || item.description,
            itemTypeId: itemTypeId || item.itemTypeId,
            categoryId: categoryId || item.categoryId,
            updatedAt: Math.floor(Date.now() / 1000), // Store timestamp in seconds
            updatedBy: adminId, // Store admin ID who made the update
        });

        // Return success response with updated item ID
        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "Item updated successfully.",
            data: { itemId },
            error: "",
        });
    } catch (error) {
        console.error("Error in updateItemByAdmin:", error);

        // Handle server errors and return a 500 Internal Server Error response
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data: "",
            error: error.message,
        });
    }
};

const deleteItem = async (req, res) => {
    try {
        // Extract item ID from request parameters
        const { itemId } = req.params;
        const adminId = req.admin.id; // Get admin ID from authenticated admin

        // Validate request input using predefined validation rules
        const validation = new VALIDATOR(req.params, {
            itemId: validationRules.Item.id,
        });

        // If validation fails, return a 400 Bad Request response
        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data : "",
                error: validation.errors.all(),
            });
        }

        // Check if the item exists and is not already deleted
        const item = await Item.findOne({
            where: { id: itemId, isDeleted: false },
            attributes: ["id"]
        });

        // If item does not exist, return a 404 Not Found response
        if (!item) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found.",
                data : "",
                error : ""
            });
        }

        // Soft delete the item by updating isDeleted flag and storing deletion metadata
        await item.update({
            isDeleted: true,
            deletedBy : adminId, // Store admin ID who performed the deletion
            deletedAt: Math.floor(Date.now() / 1000), // Store timestamp in seconds
        });

        // Return success response indicating item deletion
        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "Item deleted successfully.",
            data : "",
            error : ""
        });
    } catch (error) {
        console.error("Error in deleteItemByAdmin:", error);

        // Handle server errors and return a 500 Internal Server Error response
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data : "",
            error: error.message
        });
    }
};

const deactivateItem = async (req, res) => {
    try {
        // Extract item ID from request parameters
        const { itemId } = req.params;
        const adminId = req.admin.id; // Get admin ID from authenticated admin

        // Validate request input using predefined validation rules
        const validation = new VALIDATOR(req.params, {
            itemId: validationRules.Item.id,
        });

        // If validation fails, return a 400 Bad Request response
        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data : "",
                error: validation.errors.all(),
            });
        }

        // Check if the item exists and is not deleted
        const item = await Item.findOne({
            where: { id: itemId, isDeleted: false },
            attributes: ["id", "isActive"]
        });

        // If item does not exist, return a 404 Not Found response
        if (!item) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found.",
                data : "",
                error : "",
            });
        }

        // Toggle item's active status
        const toggle = !item.isActive;

        // Update item with new active status and store metadata
        await item.update({
            isActive: toggle,
            updatedAt : Math.floor(Date.now() / 1000), // Store update timestamp in seconds
            updatedBy : adminId, // Store admin ID who performed the update
        });

        // Return success response indicating item activation/deactivation
        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: `Item ${toggle ? "activated" : "deactivated"} successfully.`,
            data: { itemId, isActive: toggle },
            error : ""
        });
    } catch (error) {
        console.error("Error in deactivateItemByAdmin:", error);

        // Handle server errors and return a 500 Internal Server Error response
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data : "",
            error: error.message
        });
    }
};

const getAllItems = async (req, res) => {
    try {
        // Extract query parameters with default values
        const { page = 1, limit = 10, search, sortField = "i.created_at", sortOrder = "DESC", categoryId, itemTypeId } = req.query;
        const offset = (page - 1) * limit; // Calculate offset for pagination

        let replacements = { limit: parseInt(limit), offset: parseInt(offset) }; // Prepare replacements for SQL query

        // Construct the SELECT clause to retrieve item details along with user, company, item type, and category information
        let selectClause = `
            SELECT 
                i.id, i.name AS "itemName",
                i.image AS "itemImage",
                u.id AS "userId",  
                u.name AS "userName", 
                comp.id AS "companyId",
                comp.name AS "companyName",
                it.id AS "itemTypeId",
                it.name AS "itemTypeName",
                c.id AS "categoryId", 
                c.name AS "categoryName"
        `;

        // Construct the FROM clause with necessary table joins
        let fromClause = `\n
            FROM item i
            LEFT JOIN users u ON i.created_by = u.id
            LEFT JOIN company comp ON u.company_id = comp.id
            LEFT JOIN item_type it ON i.item_type_id = it.id
            LEFT JOIN category c ON i.category_id = c.id
        `;

        // Construct the WHERE clause with conditions to filter only active and non-deleted records
        let whereClause = `\n
            WHERE i.is_active = true 
            AND i.is_deleted = false 
            AND u.is_deleted = false 
            AND c.is_deleted = false 
            AND it.is_deleted = false
        `;

        // Apply search filter if search query is provided
        if (search) {
            whereClause += ` AND (i.name ILIKE :search OR u.name ILIKE :search OR comp.name ILIKE :search)`;
            replacements.search = `%${search}%`;
        }

        // Apply category filter if categoryId is provided
        if (categoryId) {
            whereClause += ` AND i.category_id = :categoryId`;
            replacements.categoryId = categoryId;
        }

        // Apply item type filter if itemTypeId is provided
        if (itemTypeId) {
            whereClause += ` AND i.item_type_id = :itemTypeId`;
            replacements.itemTypeId = itemTypeId;
        }

        // Define allowed sorting fields and their corresponding database column names
        const allowedSortFields = {
            itemName: "i.name",
            userName: "u.name",
            companyName: "comp.name",
            itemTypeName: "it.name",
            categoryName: "c.name",
            created_at: "i.created_at"
        };

        // Determine sorting field and order
        const orderField = allowedSortFields[sortField] || "i.created_at";
        const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

        // Construct final query with sorting, pagination, and filtering
        const query = ""
          .concat(selectClause)
          .concat(fromClause)
          .concat(whereClause)
          .concat(` ORDER BY ${orderField} ${order} LIMIT :limit OFFSET :offset`);

        // Construct count query to get total items
        const countQuery = ""
          .concat(`SELECT COUNT(i.id) AS "totalItems" `)
          .concat(fromClause)
          .concat(whereClause);
      
        // Execute query to fetch items
        const items = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        // Execute query to get total count of items
        const countResult = await sequelize.query(countQuery, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        // Extract total item count
        const totalItems = Number(countResult[0]?.totalItems) || 0;

        // Return response with items and total count
        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: totalItems > 0 ? "Items retrieved successfully." : "No items found.",
            total: totalItems,
            data: items,
            error: null,
        });
    } catch (error) {
        console.error("Error in getAllItems:", error);

        // Handle server errors and return a 500 Internal Server Error response
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data: null,
            error: error.message,
        });
    }
};

module.exports = {
    getAllItems,
    updateItem,
    deleteItem,
    deactivateItem
};
