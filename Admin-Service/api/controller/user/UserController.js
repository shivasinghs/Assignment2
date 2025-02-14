const { User } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require("../../../config/sequelize");

const editUser = async (req, res) => {
    try {
        // Extract user input from request body
        const { userId, name, gender, phone, email } = req.body;
        const admin = req.admin; // Get admin details from request

        // Validate input data using validation rules
        const validation = new VALIDATOR(req.body, {
            userId: validationRules.User.id,
            name: validationRules.User.name,
            gender: validationRules.User.gender,
            phone: validationRules.User.phone,
            email: validationRules.User.email,
        });

        // If validation fails, return a 400 Bad Request response
        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data: "",
                errors: validation.errors.all(),
            });
        }

        // Prevent the admin from updating a user's email to be the same as their own
        if (email && email.toLowerCase() === admin.email.toLowerCase()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "You cannot update the user's email to be the same as the admin's email.",
                data: "",
                error: "",
            });
        }

        // Check if the user exists and is active
        const user = await User.findOne({
            where: { id: userId, isActive: true, isDeleted: false },
            attributes: ["id", "email"],
        });

        // If the user does not exist or is deleted, return a 404 Not Found response
        if (!user) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "User not found or has been deleted.",
                data: "",
                error: "",
            });
        }

        // Update user details with new values or retain old values if not provided
        await user.update({
            name: name || user.name,
            gender: gender || user.gender,
            phone: phone || user.phone,
            email: email || user.email,
            updatedAt: Math.floor(Date.now() / 1000), // Update timestamp
            updatedBy: admin.id, // Store admin ID who updated the user
        });

        // Return success response after updating the user
        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "User updated successfully.",
            data: { userId },
            error: "",
        });
    } catch (error) {
        console.error("Error in editUser:", error);

        // Handle server errors and return a 500 Internal Server Error response
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data: "",
            error: error.message,
        });
    }
};  

const toggleUserStatus = async (req, res) => {
    try {
      // Extract user ID from request parameters
      const { userId } = req.params;
      const admin = req.admin; // Get admin details from request
  
      // Validate user ID using predefined validation rules
      const validation = new VALIDATOR(req.params, {
          userId: validationRules.User.id,
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
  
      // Fetch user details from the database (excluding deleted users)
      const user = await User.findOne({ 
          where: { id: userId, isDeleted: false },
          attributes: ["id", "isActive"]
      });
  
      // If user not found, return a 404 Not Found response
      if (!user) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "User not found.",
          data: null,
          error: "",
        });
      }
  
      // Toggle the user's active status
      user.isActive = !user.isActive;
      user.updatedAt = Math.floor(Date.now() / 1000); // Update timestamp
      user.updatedBy = admin.id; // Store admin ID who performed the action
      await user.save(); // Save the changes in the database
  
      // Return success response after toggling user status
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
        data: { userId, isActive: user.isActive },
        error: "",
      });
    } catch (error) {
      console.error("Error deactivating user:", error);
  
      // Handle server errors and return a 500 Internal Server Error response
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        data: error.message,
        error: error
      });
    }
  };  

  const deleteUser = async (req, res) => {
    try {
      // Extract user ID from request parameters
      const { userId } = req.params;
      const adminId = req.admin.id; // Get admin ID from request
  
      // Validate user ID using predefined validation rules
      const validation = new VALIDATOR(req.params, {
          userId: validationRules.User.id,
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
  
      // Fetch user details from the database (excluding already deleted users)
      const user = await User.findOne({ 
          where: { id: userId, isDeleted: false },
          attributes: ["id"],
       });
  
      // If user not found, return a 404 Not Found response
      if (!user) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "User not found.",
          data: null,
          error: "",
        });
      }
  
      // Perform soft delete by updating deletion-related fields
      await user.update({
        isDeleted: true,
        deletedBy: adminId, // Store admin ID who performed the deletion
        deletedAt: Math.floor(Date.now() / 1000), // Update deletion timestamp
      });
  
      // Return success response after deletion
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "User deleted successfully.",
        data: null,
        error: ""
      });
    } catch (error) {
      console.error("Error deleting user:", error);
  
      // Handle server errors and return a 500 Internal Server Error response
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        data: error.message,
        error: ""
      });
    }
  };  

  const getAllUsers = async (req, res) => {
    try {
        // Extract query parameters with default values
        const { 
            page = 1, 
            limit = 10, 
            search, 
            businessTypeId, 
            role, 
            startDate, 
            endDate, 
            isVerified, 
            sortField = "u.created_at", 
            sortOrder = "DESC" 
        } = req.query;
        
        // Calculate offset for pagination
        const offset = (page - 1) * limit;
        let replacements = { limit: parseInt(limit), offset: parseInt(offset) };

        // Define the SELECT clause with required fields
        let selectClause = `
            SELECT 
                u.id, u.name AS "userName", u.email, u.role, 
                u.is_verified AS "isVerified", 
                u.created_at AS "registrationDate", 
                bt.id AS "businessTypeId", bt.name AS "businessTypeName",
                c.id AS "companyId", c.name AS "companyName",
                count(i.id) AS "itemsCount"
        `;

        // Define FROM clause with necessary table joins
        let fromClause = `\n
            FROM users u
            LEFT JOIN business_type bt ON u.business_type_id = bt.id AND bt.is_deleted = false
            LEFT JOIN company c ON u.company_id = c.id AND c.is_deleted = false
        `;

        // Extend FROM clause to include item count per user
        let fromClauseWithItem = `\n
            ${fromClause}
            LEFT JOIN item i ON i.company_id = c.id AND i.is_deleted = false
        `;

        // Define WHERE clause to filter out deleted users
        let whereClause = `
            WHERE u.is_deleted = false
        `;

        // Define GROUP BY clause to aggregate item counts
        let groupByClause = `
             GROUP BY u.id,bt.id,c.id
        `;

        // Apply search filter if provided (searches name, email, and company name)
        if (search) {
            whereClause += ` AND (u.name ILIKE :search OR u.email ILIKE :search OR c.name ILIKE :search)`;
            replacements.search = `%${search}%`;
        }

        // Apply business type filter if provided
        if (businessTypeId) {
            whereClause += ` AND u.business_type_id = :businessTypeId`;
            replacements.businessTypeId = businessTypeId;
        }

        // Apply role filter if provided
        if (role) {
            whereClause += ` AND u.role = :role`;
            replacements.role = role;
        }

        // Apply date range filter if both startDate and endDate are provided
        if (startDate && endDate) {
            replacements.startDate = parseInt(startDate);
            replacements.endDate = parseInt(endDate);
            whereClause += " AND u.created_at BETWEEN :startDate AND :endDate";
        }

        // Apply verification status filter if provided
        if (isVerified !== undefined) {
            whereClause += ` AND u.is_verified = :isVerified`;
            replacements.isVerified = isVerified === "true";
        }

        // Define allowed sorting fields with corresponding database column names
        const allowedSortFields = {
            userName: "u.name",
            email: "u.email",
            itemsCount: `"itemsCount"`,
            businessTypeName: "bt.name",
            role: "u.role",
            registrationDate: "u.created_at",
            isVerified: "u.is_verified",
            companyName: "c.name",
        };

        // Validate sorting field, defaulting to "created_at" if invalid
        const orderField = allowedSortFields[sortField] || "u.created_at";
        const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

        // Construct the main query by concatenating clauses
        const query = ""
            .concat(selectClause)
            .concat(fromClauseWithItem)
            .concat(whereClause)
            .concat(groupByClause)
            .concat(` ORDER BY ${orderField} ${order} LIMIT :limit OFFSET :offset`);

        // Construct query to count total users 
        const countQuery = ""
            .concat(`SELECT COUNT(u.id) AS "totalUsers" `)
            .concat(fromClause)
            .concat(whereClause);

        // Execute the main query to retrieve users
        const users = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        // Execute count query to get the total number of users
        const countResult = await sequelize.query(countQuery, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        // Extract total users count from query result
        const totalUsers = Number(countResult[0]?.totalUsers) || 0;

        // Return successful response with users and total count
        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: totalUsers > 0 ? "Users retrieved successfully." : "No users found.",
            total: totalUsers,
            data: users,
            error: null,
        });
    } catch (error) {
        console.error("Error in getAllUsers:", error);

        // Handle server errors and return appropriate response
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data: null,
            error: error.message,
        });
    }
};

module.exports = {
    getAllUsers,
    editUser, 
    toggleUserStatus,
    deleteUser
};
