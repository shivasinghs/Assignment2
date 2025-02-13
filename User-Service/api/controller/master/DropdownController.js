const sequelize = require('../../../config/sequelize')
const { HTTP_STATUS_CODE } = require("../../../config/constants");

const getAllBusinessTypes = async (req, res) => {
    try {  
      const query = `
       SELECT id AS BusinessTypeId, name 
       FROM business_type
       WHERE is_deleted = false 
       ORDER BY created_at ASC
      `;
  
      const businessTypes = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
  
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
  
      if (businessTypes.length === 0) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "No Business Types found.",
          data: [],
          error: null,
        });
      }
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Business Types retrieved successfully.",
        data: {
          total: totalBusinessTypes,
          businessTypes,
        },
        error: null,
      });
    } catch (error) {
      console.error("Error in getAllBusinessTypes:", error);
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
        const query = `
            SELECT id, name, description
            FROM item_type
            WHERE is_deleted = false
            ORDER BY created_at ASC
        `;

        const itemTypes = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

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

        if (itemTypes.length === 0) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "No Item Types found.",
                data: '',
                error: null,
            });
        }

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
            data: "",
            error: error.message,
        });
    }
};

const getAllCategories = async (req, res) => {
    try {
      const query = `
        SELECT id, name, description, item_type_id, logo
        FROM category
        WHERE is_deleted = false
        ORDER BY created_at ASC
      `;
  
      const categories = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
  
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
  
      if (categories.length === 0) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "No Categories found.",
          data: [],
          error: null,
        });
      }
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Categories retrieved successfully.",
        data: {
          total: totalCategories,
          categories,
        },
        error: null,
      });
    } catch (error) {
      console.error("Error in getAllCategories:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        data : "",
        error: error.message,
      });
    }
  };

module.exports = {
    getAllBusinessTypes,
    getAllItemTypes,
    getAllCategories
};
