const sequelize = require('../../../config/sequelize')
const { HTTP_STATUS_CODE } = require("../../../config/constants");

const getAllBusinessTypes = async (req, res) => {
  try {  
    // Query to retrieve all business types that are not deleted
    const query = `
     SELECT id AS BusinessTypeId, name 
     FROM business_type
     WHERE is_deleted = false 
     ORDER BY created_at ASC
    `;

    // Query to count total business types that are not deleted
    const countQuery = `
      SELECT COUNT(id) AS totalBusinessTypes
      FROM business_type
      WHERE is_deleted = false
    `;

    // Execute query to fetch business types
    const businessTypes = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    // Execute query to get the total count of business types
    const countResult = await sequelize.query(countQuery, {
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    // Extract and parse total count from result
    const totalBusinessTypes = Number(countResult[0]?.totalbusinesstypes) || 0;

    // Return success response with business types data
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

    // Handle internal server error
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
      // SQL query to fetch all item types that are not deleted
      const query = `
          SELECT id, name, description
          FROM item_type
          WHERE is_deleted = false
          ORDER BY created_at ASC
      `;

      // SQL query to count total number of item types that are not deleted
      const countQuery = `
          SELECT COUNT(id) AS totalItemTypes
          FROM item_type
          WHERE is_deleted = false
      `;

      // Execute query to retrieve item types
      const itemTypes = await sequelize.query(query, {
          type: sequelize.QueryTypes.SELECT,
          raw: true,
      });

      // Execute query to get the total count of item types
      const countResult = await sequelize.query(countQuery, {
          type: sequelize.QueryTypes.SELECT,
          raw: true,
      });

      // Extract and parse total count from result
      const totalItemTypes = Number(countResult[0]?.totalitemtypes) || 0;

      // Return success response with item types data
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

      // Handle internal server error
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
      // SQL query to fetch all categories that are not deleted
      const query = `
          SELECT id, name, description, item_type_id, logo
          FROM category
          WHERE is_deleted = false
          ORDER BY created_at ASC
      `;

      // SQL query to count total number of categories that are not deleted
      const countQuery = `
          SELECT COUNT(id) AS totalCategories
          FROM category
          WHERE is_deleted = false
      `;

      // Execute query to retrieve categories
      const categories = await sequelize.query(query, {
          type: sequelize.QueryTypes.SELECT,
          raw: true,
      });

      // Execute query to get the total count of categories
      const countResult = await sequelize.query(countQuery, {
          type: sequelize.QueryTypes.SELECT,
          raw: true,
      });

      // Extract and parse total count from result
      const totalCategories = Number(countResult[0]?.totalcategories) || 0;

      // Return success response with categories data
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

      // Handle internal server error
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
          status: HTTP_STATUS_CODE.SERVER_ERROR,
          message: "Internal server error.",
          data: "",
          error: error.message,
      });
  }
};

module.exports = {
    getAllBusinessTypes,
    getAllItemTypes,
    getAllCategories
};
