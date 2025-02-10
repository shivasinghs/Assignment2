const { Category } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR,Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const deleteImage = require("../../helper/imageHandler/delete");
const sequelize = require('../../../config/sequelize');

const createCategory = async (req, res) => {
  try {
    const { itemTypeId, name, description } = req.body;
    const logo = req.file;
    const admin = req.admin;
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

    const validation = new VALIDATOR(req.body, {
      name: validationRules.Category.name,
      itemTypeId: validationRules.Category.itemTypeId,
      description: validationRules.Category.description
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all()
      });
    }

    const existingCategory = await Category.findOne({
        where: { name: { [Op.iLike]: name }, isDeleted: false },
        attributes: ["id"],
      });
  
      if (existingCategory) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Category already exists.",
        });
      }

    let logoPath = null;
    if (logo) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(logo.mimetype) || logo.size > 2 * 1024 * 1024) {
        deleteImage(logo.path);  
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid logo. Only PNG, JPEG, JPG allowed & max size 2MB."
        });
      }
      logoPath = baseUrl + logo.filename;  
    }

    const newCategory = await Category.create({
      name,
      itemTypeId,
      description,
      logo: logoPath,
      createdBy: admin.id
    });

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Category created successfully.",
      data: {
        categoryId: newCategory.id
      }
    });
  } catch (error) {
    console.error("Error in createCategory:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message
    });
  }
};

const getCategoryById = async (req, res) => {
    try {
      const { categoryId } = req.params;
  
      const validation = new VALIDATOR(req.params, {
        categoryId: validationRules.Category.id,
      });
  
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid input.",
          err: validation.errors.all(),
        });
      }
  
      const category = await Category.findOne({
        where: { id: categoryId, isDeleted: false, isActive: true },
        attributes: ["name", "description", "itemTypeId", "createdBy", "logo"],
      });
  
      if (!category) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "Category not found.",
        });
      }
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Category details retrieved successfully.",
        data: category,
      });
    } catch (error) {
      console.error("Error in getCategoryById:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        err: error.message,
      });
    }
  };
  
const updateCategory = async (req, res) => {
    try {
      const { categoryId, name,  description, removeLogo } = req.body;
      const logo = req.file;
      const admin = req.admin;
      const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;
  
      const validation = new VALIDATOR(req.body, {
        categoryId: validationRules.Category.id,
        name: validationRules.Category.name,
        description: validationRules.Category.description
      });
  
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid input.",
          err: validation.errors.all()
        });
      }

      const existingCategory = await Category.findOne({
        where: {
          name: { [Op.iLike]: name },
          id: { [Op.ne]: categoryId },
          isDeleted: false,
        },
        attributes: ["id"],
      });
  
      if (existingCategory) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Category with this name already exists.",
        });
      }
  
      const category = await Category.findOne({
        where: { id: categoryId, isDeleted: false },
        attributes: ["id", "logo"]
      });
  
      if (!category) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "Category not found.",
          err: null
        });
      }
  
      let logoPath = category.logo;
  
      if (logo) {
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!allowedTypes.includes(logo.mimetype) || logo.size > 2 * 1024 * 1024) {
          deleteImage(logo.path);  
          return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
            status: HTTP_STATUS_CODE.BAD_REQUEST,
            message: "Invalid logo. Only PNG, JPEG, JPG allowed & max size 2MB."
          });
        }
  
        if (logoPath) {
          deleteImage(logoPath.replace(baseUrl, ""));
        }
        logoPath = baseUrl + logo.filename;  
      }
  
      if (removeLogo === "true" && logoPath) {
        deleteImage(category.logo.replace(baseUrl, ""));
        logoPath = null;
      }
  
      await category.update({
        name: name || category.name,
        description: description || category.description,
        logo: logoPath,
        updatedAt: Math.floor(Date.now() / 1000),
        updatedBy: admin.id
      });
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Category updated successfully.",
        data: { categoryId }
      });
    } catch (error) {
      console.error("Error in updateCategory:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        err: error.message
      });
    }
  };
  

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const admin = req.admin;

    const validation = new VALIDATOR(req.params, {
      categoryId: validationRules.Category.id,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    const category = await Category.findOne({
      where: { id: categoryId, isDeleted: false },
      attributes: ["id"],
    });

    if (!category) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Category not found.",
      });
    }

    await category.update({
      isDeleted: true,
      deletedBy: admin.id,
      deletedAt: Math.floor(Date.now() / 1000),
    });

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message,
    });
  }
};

const getAllCategories = async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * pageSize;
  
      const query = `
        SELECT id, name, description, item_type_id, logo
        FROM category
        WHERE is_deleted = false
        ORDER BY created_at ASC
        LIMIT :limit OFFSET :offset
      `;
  
      const categories = await sequelize.query(query, {
        replacements: { limit: pageSize, offset },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
  
      if (categories.length === 0) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "No Categories found.",
          data: [],
          err: null,
        });
      }
  
      const countQuery = `
        SELECT COUNT(*) AS totalCategories
        FROM category
        WHERE is_deleted = false
      `;
  
      const countResult = await sequelize.query(countQuery, {
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
  
      const totalCategories = Number(countResult[0]?.totalcategories) || 0;
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Categories retrieved successfully.",
        data: {
          total: totalCategories,
          categories,
        },
        err: null,
      });
    } catch (error) {
      console.error("Error in getAllCategories:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        err: error.message,
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
