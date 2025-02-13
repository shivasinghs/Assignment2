const { Item } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require("../../../config/sequelize");

const updateItemByAdmin = async (req, res) => {
    try {
        const { itemId, name, description, itemTypeId, categoryId, companyId } = req.body;
        const adminId = req.admin.id;

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
                error: validation.errors.all(),
            });
        }

        const existingItem = await Item.findOne({
            where: {
                name: { [Op.iLike]: name },
                id: { [Op.ne]: itemId },
                isDeleted: false,
                companyId,
            },
            attributes: ["id"],
        });

        if (existingItem) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Item with this name already exists.",
                data: "",
                error: "",
            });
        }

        const item = await Item.findOne({
            where: { id: itemId, isDeleted: false, isActive: true },
            attributes: ["id"],
        });

        if (!item) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found.",
                data: "",
                error: "",
            });
        }

        await item.update({
            name: name || item.name,
            description: description || item.description,
            itemTypeId: itemTypeId || item.itemTypeId,
            categoryId: categoryId || item.categoryId,
            updatedAt: Math.floor(Date.now() / 1000),
            updatedBy: adminId,
        });

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "Item updated successfully.",
            data: { itemId },
            error: "",
        });
    } catch (error) {
        console.error("Error in updateItemByAdmin:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data: "",
            error: error.message,
        });
    }
};

const deleteItemByAdmin = async (req, res) => {
    try {
        const { itemId } = req.params;
        const adminId = req.admin.id;

        const validation = new VALIDATOR(req.params, {
            itemId: validationRules.Item.id,
        });

        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data : "",
                error: validation.errors.all(),
            });
        }

        const item = await Item.findOne({
            where: { id: itemId, isDeleted: false },
            attributes: ["id"]
        });

        if (!item) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found.",
                data : "",
                error : ""
            });
        }

        await item.update({
            isDeleted: true,
            deletedBy : adminId,
            deletedAt: Math.floor(Date.now() / 1000),
        });

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "Item deleted successfully.",
            data : "",
            error : ""
        });
    } catch (error) {
        console.error("Error in deleteItemByAdmin:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data : "",
            error: error.message
        });
    }
};

const deactivateItemByAdmin = async (req, res) => {
    try {
        const { itemId } = req.params;
        const adminId = req.admin.id;

        const validation = new VALIDATOR(req.params, {
            itemId: validationRules.Item.id,
        });

        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data : "",
                error: validation.errors.all(),
            });
        }

        const item = await Item.findOne({
            where: { id: itemId, isDeleted: false },
            attributes: ["id", "isActive"]
        });

        if (!item) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found.",
                data : "",
                error : "",
            });
        }
        const toggle = !item.isActive
        await item.update({
            isActive: toggle,
            updatedAt : Math.floor(Date.now() / 1000),
            updatedBy : adminId,
        });

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: `Item ${item.isActive ? "activated" : "deactivated"} successfully.`,
            data: { itemId, isActive: item.isActive },
            error : ""
        });
    } catch (error) {
        console.error("Error in deactivateItemByAdmin:", error);
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
        const { page = 1, limit = 10, search, sortField = "i.created_at", sortOrder = "DESC", categoryId, itemTypeId } = req.query;
        const offset = (page - 1) * limit;

        let replacements = { limit: parseInt(limit), offset: parseInt(offset) };

        let selectClause = `
            SELECT 
                i.id, i.name AS "itemName",
                i.image AS "itemImage",
                u.id AS "userId",  
                u.name AS "userName", 
                comp.id AS "companyId",
                comp.name AS "companyName",
                it.id AS "itemTypeId" ,
                it.name AS "itemTypeName",
                c.id AS "categoryName", 
                c.name AS "categoryName"
                `;

        let fromClause = `\n
            FROM item i
            LEFT JOIN users u ON i.created_by = u.id
            LEFT JOIN company comp ON u.company_id = comp.id
            LEFT JOIN item_type it ON i.item_type_id = it.id
            LEFT JOIN category c ON i.category_id = c.id
        `;

        let whereClause = `\n
            WHERE i.is_active = true 
            AND i.is_deleted = false 
            AND u.is_deleted = false 
            AND c.is_deleted = false 
            AND it.is_deleted = false
        `;

        if (search) {
            whereClause += ` AND (i.name ILIKE :search OR u.name ILIKE :search OR comp.name ILIKE :search)`;
            replacements.search = `%${search}%`;
        }

        if (categoryId) {
            whereClause += ` AND i.category_id = :categoryId`;
            replacements.categoryId = categoryId;
        }

        if (itemTypeId) {
            whereClause += ` AND i.item_type_id = :itemTypeId`;
            replacements.itemTypeId = itemTypeId;
        }

        const allowedSortFields = {
            itemName: "i.name",
            userName: "u.name",
            companyName: "comp.name",
            itemTypeName: "it.name",
            categoryName: "c.name",
            created_at: "i.created_at"
        };

        const orderField = allowedSortFields[sortField] || "i.created_at";
        const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

        const query = ""
          .concat(selectClause)
          .concat(fromClause)
          .concat(whereClause)
          .concat(` ORDER BY ${orderField} ${order} LIMIT :limit OFFSET :offset`);

          const countQuery = ""
          .concat(`SELECT COUNT(i.id) AS "totalItems" `)
          .concat(fromClause)
          .concat(whereClause);
      

        const items = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        const countResult = await sequelize.query(countQuery, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        const totalItems = Number(countResult[0]?.totalItems) || 0;

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: totalItems > 0 ? "Items retrieved successfully." : "No items found.",
            total: totalItems,
            data: items,
            error: null,
        });
    } catch (error) {
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
    getAllItems,
    updateItemByAdmin,
    deleteItemByAdmin,
    deactivateItemByAdmin
};
