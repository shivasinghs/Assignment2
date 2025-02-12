const { ItemType } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require("../../../config/sequelize");

const createItemType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const admin = req.admin;

    const validation = new VALIDATOR(req.body, {
      name: validationRules.ItemType.name,
      description: validationRules.ItemType.description
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data : "",
        error: validation.errors.all(),
      });
    }

    const existingItemType = await ItemType.findOne({
      where: { name: { [Op.iLike]: name }, isDeleted: false },
      attributes: ["id"],
    });

    if (existingItemType) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Item Type already exists.",
        data : "",
        error : ""
      });
    }

    const newItemType = await ItemType.create({
      name,
      description,
      createdBy: admin.id,
    });

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Item Type created successfully.",
      data: { itemTypeId: newItemType.id },
      error : ""
    });
  } catch (error) {
    console.error("Error in createItemType:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data : "",
      error: error.message,
    });
  }
};

const getItemTypeById = async (req, res) => {
  try {
    const { itemTypeId } = req.params;

    const validation = new VALIDATOR(req.params, {
      itemTypeId: validationRules.ItemType.id,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data : "",
        error: validation.errors.all(),
      });
    }

    const itemType = await ItemType.findOne({
      where: { id: itemTypeId, isDeleted: false, isActive: true },
      attributes: ["name", "description", "createdBy"],
    });

    if (!itemType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Item Type not found.",
        data : "",
        error :""
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Item Type details retrieved successfully.",
      data: itemType,
      error : ""
    });
  } catch (error) {
    console.error("Error in getItemTypeById:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data : "",
      error: error.message,
    });
  }
};

const updateItemType = async (req, res) => {
  try {
    const { itemTypeId, name, description } = req.body;
    const admin = req.admin;

    const validation = new VALIDATOR(req.body, {
      itemTypeId: validationRules.ItemType.id,
      name: validationRules.ItemType.name,
      description: validationRules.ItemType.description
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        data : "",
        error: validation.errors.all(),
      });
    }

    const existingItemType = await ItemType.findOne({
        where: {
          name: { [Op.iLike]: name }, 
          id: { [Op.ne]: itemTypeId },
          isDeleted: false,
        },
        attributes: ["id"],
      });
  
      if (existingItemType) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Item Type with this name already exists.",
          data : "",
          error : ""
        });
      }

    const itemType = await ItemType.findOne({
      where: { id: itemTypeId, isDeleted: false },
      attributes: ["id"],
    });

    if (!itemType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Item Type not found.",
        data : "",
        error : ""
      });
    }

    await itemType.update({ 
        name, 
        description, 
        updatedBy: admin.id,
        updatedAt: Math.floor(Date.now() / 1000),
    });

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Item Type updated successfully.",
      data: { itemTypeId },
      error : ""
    });
  } catch (error) {
    console.error("Error in updateItemType:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data : "",
      error: error.message,
    });
  }
};

const deleteItemType = async (req, res) => {
  try {
    const { itemTypeId } = req.params;
    const admin = req.admin;

    const validation = new VALIDATOR(req.params, {
        itemTypeId: validationRules.ItemType.id,
      });
  
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid input.",
           data : "",
          error: validation.errors.all(),
        });
      }

    const itemType = await ItemType.findOne({
      where: { id: itemTypeId, isDeleted: false },
      attributes : ['id']
    });

    if (!itemType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Item Type not found.",
         data : "",
        error : ""
      });
    }

    await itemType.update({ 
        isDeleted: true,
        deletedBy: admin.id,
        deletedAt : Math.floor(Date.now() / 1000)
     });

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Item Type deleted successfully.",
       data : "",
       error : ""
    });
  } catch (error) {
    console.error("Error in deleteItemType:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
       data : "",
      error: error.message,
    });
  }
};

const getAllItemTypes = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * pageSize;

        const query = `
            SELECT id, name, description
            FROM item_type
            WHERE is_deleted = false
            ORDER BY created_at ASC
            LIMIT :limit OFFSET :offset
        `;

        const itemTypes = await sequelize.query(query, {
            replacements: { limit: pageSize, offset },
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        if (itemTypes.length === 0) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "No Item Types found.",
                data: [],
                error: null,
            });
        }

        const countQuery = `
            SELECT COUNT(*) AS totalItemTypes
            FROM item_type
            WHERE is_deleted = false
        `;

        const countResult = await sequelize.query(countQuery, {
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        const totalItemTypes = Number(countResult[0]?.totalitemtypes) || 0;

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "Item Types retrieved successfully.",
            data: {
                total: totalItemTypes,
                itemTypes,
            },
            error: null,
        });
    } catch (error) {
        console.error("Error in getAllItemTypes:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
             data : "",
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
