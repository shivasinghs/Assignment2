const { User } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require("../../../config/sequelize");

const editUser = async (req, res) => {
    try {
        const { userId, name, gender, phone, email} = req.body;
        const admin = req.admin;

        const validation = new VALIDATOR(req.body, {
            userId: validationRules.User.id,
            name: validationRules.User.name,
            gender: validationRules.User.gender,
            phone: validationRules.User.phone,
            email: validationRules.User.email,
        });

        if (validation.fails()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "Invalid input.",
                data : "",
                errors: validation.errors.all(),
            });
        }

        if (email && email.toLowerCase() === admin.email.toLowerCase()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "You cannot update the user's email to be the same as the admin's email.",
                data : "",
                error : "",
            });
        }

        const user = await User.findOne({
            where: { id: userId, isActive: true, isDeleted: false },
            attributes: ["id","email"],
        });

        if (!user) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "User not found or has been deleted.",
                data : "",
                error : ""
            });
        }
        
        await user.update({
            name: name || user.name,
            gender: gender || user.gender,
            phone: phone || user.phone,
            email: email || user.email,
            updatedAt: Math.floor(Date.now() / 1000),
            updatedBy: admin.id,
        });

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "User updated successfully.",
            data: { userId },
            error : "",
        });
    } catch (error) {
        console.error("Error in editUser:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
            data : "",
            error: error.message,
        });
    }
};  

const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const admin = req.admin;

    const validation = new VALIDATOR(req.params, {
        userId: validationRules.User.id,
    });

    if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
            status: HTTP_STATUS_CODE.BAD_REQUEST,
            message: "Invalid input.",
            data : "",
            error: validation.errors.all(),
        });
    }

    const user = await User.findOne({ 
        where: { id: userId, isDeleted: false },
        attributes: ["id", "isActive"]
    });
    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "User not found.",
        data: null,
        error : "",
      });
    }

    user.isActive = !user.isActive;
    user.updatedAt = Math.floor(Date.now() / 1000);
    user.updatedBy = admin.id;
    await user.save();

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
      data: { userId, isActive: user.isActive },
      error : "",
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
      error : error
    });
  }
};


const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.admin.id; 

    const validation = new VALIDATOR(req.params, {
        userId: validationRules.User.id,
    });

    if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
            status: HTTP_STATUS_CODE.BAD_REQUEST,
            message: "Invalid input.",
            data : "",
            error: validation.errors.all(),
        });
    }

    const user = await User.findOne({ 
        where: { id: userId, isDeleted: false },
        attributes: ["id"],
     });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "User not found.",
        data: null,
        error : "",
      });
    }

    await user.update({
      isDeleted: true,
      deletedBy: adminId,
      deletedAt: Math.floor(Date.now() / 1000),
    });

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "User deleted successfully.",
      data: null,
      error : ""
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
      error : ""
    });
  }
};

const getAllUsers = async (req, res) => {
    try {
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
        
        const offset = (page - 1) * limit;
        let replacements = { limit: parseInt(limit), offset: parseInt(offset) };

        let selectClause = `
            SELECT 
                u.id, u.name AS "userName", u.email, u.role, 
                u.is_verified AS "isVerified", 
                u.created_at AS "registrationDate", 
                bt.id AS "businessTypeId", bt.name AS "businessTypeName",
                c.id AS "companyId", c.name AS "companyName",
                count(i.id) AS "itemsCount"
        `;

        let fromClause = `\n
            FROM users u
            LEFT JOIN business_type bt ON u.business_type_id = bt.id AND bt.is_deleted = false
            LEFT JOIN company c ON u.company_id = c.id AND c.is_deleted = false
        `;

        let fromClauseWithItem = `\n
            ${fromClause}
            LEFT JOIN item i ON i.company_id = c.id AND i.is_deleted = false
        `;

        let whereClause = `
            WHERE u.is_deleted = false
        `;

        let groupByClause = `
             GROUP BY u.id,bt.id,c.id
        `;

        if (search) {
            whereClause += ` AND (u.name ILIKE :search OR u.email ILIKE :search OR c.name ILIKE :search)`;
            replacements.search = `%${search}%`;
        }
        if (businessTypeId) {
            whereClause += ` AND u.business_type_id = :businessTypeId`;
            replacements.businessTypeId = businessTypeId;
        }
        if (role) {
            whereClause += ` AND u.role = :role`;
            replacements.role = role;
        }
        if (startDate && endDate) {
            replacements.startDate = parseInt(startDate);
            replacements.endDate = parseInt(endDate);
        
            whereClause += " AND u.created_at BETWEEN :startDate AND :endDate";
        }        
        if (isVerified !== undefined) {
            whereClause += ` AND u.is_verified = :isVerified`;
            replacements.isVerified = isVerified === "true";
        }

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

        const orderField = allowedSortFields[sortField] || "u.created_at";
        const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

        const query = ""
            .concat(selectClause)
            .concat(fromClauseWithItem)
            .concat(whereClause)
            .concat(groupByClause)
            .concat(` ORDER BY ${orderField} ${order} LIMIT :limit OFFSET :offset`);

        const countQuery = ""
            .concat(`SELECT COUNT(u.id) AS "totalUsers" `)
            .concat(fromClause)
            .concat(whereClause);

        const users = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        const countResult = await sequelize.query(countQuery, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        const totalUsers = Number(countResult[0]?.totalUsers) || 0;

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: totalUsers > 0 ? "Users retrieved successfully." : "No users found.",
            total: totalUsers,
            data: users,
            error: null,
        });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
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
