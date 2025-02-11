const { BusinessType,Admin } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR,Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require('../../../config/sequelize')

const createBusinessType = async (req, res) => {
  try {
    const { name } = req.body;
    const admin = req.admin;
    
    const validation = new VALIDATOR(req.body, {
      name: validationRules.BusinessType.name,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    const existingBusinessType = await BusinessType.findOne({ 
        where: { name : {[Op.iLike] : name} , isDeleted : false } , attributes: ['id']
     });

    if (existingBusinessType) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Business Type already exists.",
      });
    }

    const newBusinessType = await BusinessType.create({
      name,
      createdBy: admin.id,
    });

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Business Type created successfully.",
      data: { businessTypeId: newBusinessType.id },
    });
  } catch (error) {
    console.error("Error in createBusinessType:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message,
    });
  }
};

const getBusinessTypeById = async (req, res) => {
  try {
    const { businessTypeId } = req.params;

    const validation = new VALIDATOR(req.params, {
      businessTypeId: validationRules.BusinessType.id,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    const businessType = await BusinessType.findOne({
      where: { id: businessTypeId, isDeleted: false ,isActive : true},
      attributes : ["name","created_by"]
    });

    if (!businessType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Business Type not found.",
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Business Type details retrieved successfully.",
      data: businessType,
    });
  } catch (error) {
    console.error("Error in getBusinessTypeById:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message,
    });
  }
};

const updateBusinessType = async (req, res) => {
    try {
      const { businessTypeId, name } = req.body;
      const admin = req.admin;
    
      const validation = new VALIDATOR(req.body, {
        businessTypeId: validationRules.BusinessType.id,
        name: validationRules.BusinessType.name,
      });
  
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid input.",
          err: validation.errors.all(),
        });
      }

      const existingBusinessType = await BusinessType.findOne({
        where: {
          name: { [Op.iLike]: name }, 
          id: { [Op.ne]: businessTypeId },
          isDeleted: false,
        },
        attributes: ["id"],
      });
  
      if (existingBusinessType) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Business Type with this name already exists.",
        });
      }

      const businessType = await BusinessType.findOne({
        where: { id: businessTypeId, isDeleted: false },
        attributes: ["id"],
      });
  
      if (!businessType) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "Business Type not found.",
        });
      }
  
      await businessType.update({
        name: name,
        updatedBy: admin.id,
        updatedAt: Math.floor(Date.now() / 1000),
      });
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Business Type updated successfully.",
        data: { businessTypeId: businessTypeId },
      });
    } catch (error) {
      console.error("Error in updateBusinessType:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        err: error.message,
      });
    }
  };
  

const deleteBusinessType = async (req, res) => {
  try {
    const { businessTypeId } = req.params;
    const admin = req.admin;
    

    const validation = new VALIDATOR(req.params, {
        businessTypeId: validationRules.BusinessType.id,
      });
  
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid input.",
          err: validation.errors.all(),
        });
      }

    const businessType = await BusinessType.findOne({
      where: { id: businessTypeId, isDeleted: false },
      attributes : ['id']
    });

    if (!businessType) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Business Type not found.",
      });
    }

    await businessType.update({ 
        isDeleted: true,
        deletedBy: admin.id,
        deletedAt : Math.floor(Date.now() / 1000)
     });

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Business Type deleted successfully.",
      data: {businessTypeId: businessTypeId },
    });
  } catch (error) {
    console.error("Error in deleteBusinessType:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message,
    });
  }
};

const getAllBusinessTypes = async (req, res) => {
    try {  
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * pageSize;
  
      const query = `
       SELECT id AS BusinessTypeId, name 
       FROM business_type
       WHERE is_deleted = false 
       ORDER BY created_at ASC
        LIMIT :limit OFFSET :offset
      `;
  
      const businessTypes = await sequelize.query(query, {
        replacements: { limit: pageSize, offset },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
  
      if (businessTypes.length === 0) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "No Business Types found.",
          data: [],
          err: null,
        });
      }
  
      const countQuery = `
        SELECT COUNT(*) AS totalBusinessTypes
        FROM business_type
        WHERE is_deleted = false
      `;
  
      const countResult = await sequelize.query(countQuery, {
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
  
      const totalBusinessTypes = Number(countResult[0]?.totalbusinesstypes) || 0;
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Business Types retrieved successfully.",
        data: {
          total: totalBusinessTypes,
          businessTypes,
        },
        err: null,
      });
    } catch (error) {
      console.error("Error in getAllBusinessTypes:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        err: error.message,
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
