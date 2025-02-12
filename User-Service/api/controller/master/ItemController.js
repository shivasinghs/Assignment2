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

        const validation = new VALIDATOR(req.body, {
            name: validationRules.Item.name,
            description: validationRules.Item.description,
            itemTypeId: validationRules.Item.itemTypeId,
            categoryId: validationRules.Item.categoryId,
        });

        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                err: validation.errors.all()
            });
        }

        const existingItem = await Item.findOne({
            where: { name: { [Op.iLike]: name }, isDeleted: false, companyId: user.companyId }, 
            attributes: ["id"],
        });

        if (existingItem) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Item with this name already exists in your company.",
            });
        }

        let imagePath = null;
        if (image) {
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
            if (!allowedTypes.includes(image.mimetype) || image.size > 2 * 1024 * 1024) {
                deleteImage(image.path);
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                    status: HTTP_STATUS_CODE.BAD_REQUEST,
                    message: "Invalid image. Only PNG, JPEG, JPG allowed & max size 2MB."
                });
            }
            imagePath = baseUrl + image.filename;
        }

        const newItem = await Item.create({
            name,
            description,
            image: imagePath,
            itemTypeId,
            categoryId,
            companyId: user.companyId, 
            createdBy: user.id
        });

        return res.status(HTTP_STATUS_CODE.CREATED).json({
            status: HTTP_STATUS_CODE.CREATED,
            message: "Item created successfully.",
            data: {
                itemId: newItem.id
            }
        });
    } catch (error) {
        console.error("Error in createItem:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            err: error.message
        });
    }
};

const getItemById = async (req, res) => {
    try {
        const { itemId } = req.params;
        const user = req.user;

        const validation = new VALIDATOR(req.params, {
            itemId: validationRules.Item.id,
        });

        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data: null,
                error: validation.errors.all(),
            });
        }

        const query = `
            SELECT 
                i.id AS "itemId", i.name AS "itemName", i.description AS "itemDescription", i.image AS "itemImage",
                i.item_type_id AS "itemTypeId", it.name AS "itemTypeName",
                i.category_id AS "categoryId", c.name AS "categoryName",
                i.company_id AS "companyId",
                i.created_by AS "createdBy"
            FROM item i
            JOIN company cmp ON i.company_id = cmp.id AND cmp.is_deleted = false
            JOIN item_type it ON i.item_type_id = it.id AND it.is_deleted = false
            JOIN category c ON i.category_id = c.id AND c.is_deleted = false
            WHERE i.id = :itemId AND i.is_deleted = false AND i.company_id = :companyId AND i.is_Active = true
        `;

        const items = await sequelize.query(query, {
            replacements: { itemId, companyId: user.companyId },
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        if (items.length === 0) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found in your company.",
                data: null,
                error: null,
            });
        }

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "Item details retrieved successfully.",
            data: items[0],
            error: null,
        });
    } catch (error) {
        console.error("Error in getItemById:", error);
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

        const { itemId, name, description, itemTypeId, categoryId, removeImage } = req.body;
        const image = req.file;
        const user = req.user;
        const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

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
                err: validation.errors.all()
            });
        }

        const existingItem = await Item.findOne({
            where: {
                name: { [Op.iLike]: name },
                id: { [Op.ne]: itemId },
                isDeleted: false,
                isActive : true,
                companyId: user.companyId
            },
            attributes: ["id"],
        });

        if (existingItem) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Item with this name already exists in your company.",
            });
        }

        const item = await Item.findOne({
            where: { id: itemId, isDeleted: false, companyId: user.companyId },
            attributes: ["id", "image"]
        });

        if (!item) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found in your company.",
            });
        }

        let imagePath = item.image;

        if (image) {
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
            if (!allowedTypes.includes(image.mimetype) || image.size > 2 * 1024 * 1024) {
                deleteImage(image.path);
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                    status: HTTP_STATUS_CODE.BAD_REQUEST,
                    message: "Invalid image. Only PNG, JPEG, JPG allowed & max size 2MB."
                });
            }
        
            if (imagePath) {
                deleteImage(imagePath.replace(baseUrl, "")); 
            }
            imagePath = baseUrl + image.filename;
        }

        if (removeImage === "true" && imagePath) {
            deleteImage(item.image.replace(baseUrl, ""));
            imagePath = null;
        }

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
            data: { itemId }
        });
    } catch (error) {
        console.error("Error in updateItem:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            err: error.message
        });
    }
};

const deleteItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const user = req.user;

        const validation = new VALIDATOR(req.params, {
            itemId: validationRules.Item.id,
        });

        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                err: validation.errors.all(),
            });
        }

        const item = await Item.findOne({
            where: { id: itemId, isDeleted: false, companyId: user.companyId },
            attributes: ["id"]
        });

        if (!item) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "Item not found in your company.",
            });
        }

        await item.update({
            isDeleted: true,
            deletedBy: user.id,
            deletedAt: Math.floor(Date.now() / 1000),
        });

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "Item deleted successfully.",
        });
    } catch (error) {
        console.error("Error in deleteItem:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            err: error.message,
        });
    }
};

const getAllItems = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * pageSize;

        const query = `
            SELECT 
                i.id, i.name, i.description, i.image, 
                i.item_type_id AS "itemTypeId", it.name AS "itemTypeName",
                i.category_id AS "categoryId", c.name AS "categoryName",
                i.company_id AS "companyId"
            FROM item i
            JOIN item_type it ON i.item_type_id = it.id AND it.is_deleted = false
            JOIN category c ON i.category_id = c.id AND c.is_deleted = false
            JOIN company cmp ON i.company_id = cmp.id AND cmp.is_deleted = false
            WHERE i.is_deleted = false AND i.company_id = :companyId AND i.is_Active = true
            ORDER BY i.created_at ASC
            LIMIT :limit OFFSET :offset
        `;

        const items = await sequelize.query(query, {
            replacements: { limit: pageSize, offset, companyId: user.companyId },
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        const countQuery = `
            SELECT COUNT(*) AS "totalItems"
            FROM item
            WHERE is_deleted = false AND company_id = :companyId
        `;

        const countResult = await sequelize.query(countQuery, {
            replacements: { companyId: user.companyId },
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        const totalItems = Number(countResult[0]?.totalItems) || 0;

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: totalItems > 0 ? "Items retrieved successfully." : "No items found in your company.",
            data: totalItems > 0 ? { total: totalItems, items } : null,
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
    createItem,
    getItemById,
    updateItem,
    deleteItem,
    getAllItems,
};