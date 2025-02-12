const { User } = require("../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, Op } = require("../../../config/constants");
const validationRules = require("../../../config/validationRules");
const sequelize = require("../../../config/sequelize");
const deleteImage = require("../../helper/imageHandler/delete");

const editUser = async (req, res) => {
    try {
        const { userId, name, gender, phone, email, removeImage } = req.body;
        const admin = req.admin;
        const image = req.file;
        const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

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
                errors: validation.errors.all(),
            });
        }

        if (email && email.toLowerCase() === admin.email.toLowerCase()) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                status: HTTP_STATUS_CODE.BAD_REQUEST,
                message: "You cannot update the user's email to be the same as the admin's email.",
            });
        }

        const user = await User.findOne({
            where: { id: userId, isActive: true, isDeleted: false },
            attributes: ["id", "profileImage", "email"],
        });

        if (!user) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                status: HTTP_STATUS_CODE.NOT_FOUND,
                message: "User not found or has been deleted.",
            });
        }

        let imagePath = user.profileImage;
        if (image) {
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
            if (!allowedTypes.includes(image.mimetype) || image.size > 2 * 1024 * 1024) {
                deleteImage(image.path);
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                    status: HTTP_STATUS_CODE.BAD_REQUEST,
                    message: "Invalid image. Only PNG, JPEG, JPG allowed & max size 2MB.",
                });
            }

            if (imagePath) {
                deleteImage(imagePath.replace(baseUrl, ""));
            }
            imagePath = baseUrl + image.filename;
        }

        if (removeImage === "true" && imagePath) {
            deleteImage(user.profileImage.replace(baseUrl, ""));
            imagePath = null;
        }

        
        await user.update({
            name: name || user.name,
            gender: gender || user.gender,
            phone: phone || user.phone,
            email: email || user.email,
            profileImage: imagePath,
            updatedAt: Math.floor(Date.now() / 1000),
            updatedBy: admin.id,
        });

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: "User updated successfully.",
            data: { userId },
        });
    } catch (error) {
        console.error("Error in editUser:", error);
        return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
            status: HTTP_STATUS_CODE.SERVER_ERROR,
            message: "Internal server error.",
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
            err: validation.errors.all(),
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
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
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
            err: validation.errors.all(),
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
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
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
            sortBy = "registrationDate", 
            sortOrder = "DESC" 
        } = req.query;
        
        const offset = (page - 1) * limit;
        let whereClause = "WHERE u.is_deleted = false";
        let replacements = { limit: parseInt(limit, 10), offset: parseInt(offset, 10) };

        if (search) {
            whereClause += " AND (u.name ILIKE :search OR u.email ILIKE :search OR c.name ILIKE :search)";
            replacements.search = `%${search}%`;
        }

        if (businessTypeId) {
            whereClause += " AND u.business_type_id = :businessTypeId";
            replacements.businessTypeId = businessTypeId;
        }
        if (role) {
            whereClause += " AND u.role = :role";
            replacements.role = role;
        }
        if (startDate && endDate) {
            replacements.startDate = Math.floor(new Date(`${startDate}T00:00:00Z`).getTime() / 1000);
            replacements.endDate = Math.floor(new Date(`${endDate}T23:59:59Z`).getTime() / 1000);
            
            whereClause += " AND u.created_at BETWEEN :startDate AND :endDate";
        }                      
        if (isVerified !== undefined) {
            whereClause += " AND u.is_verified = :isVerified";
            replacements.isVerified = isVerified === "true";
        }

        const allowedSortFields = {
            name: "u.name",
            email: "u.email",
            itemsCount: `"itemsCount"`,
            businessType: "bt.name",
            role: "u.role",
            registrationDate: "u.created_at",
            isVerified: "u.is_verified",
            companyName: "c.name",
        };

        const sortField = allowedSortFields[sortBy] || "u.created_at";
        const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

        const query = `
             SELECT 
                 u.id, u.name, u.email, u.role, u.is_verified AS "isVerified", 
                 TO_TIMESTAMP(u.created_at)::DATE AS "registrationDate", 
                 bt.name AS "businessType", c.name AS "companyName",
                 (SELECT COUNT(*) FROM item i WHERE i.company_id = u.company_id AND i.is_deleted = false) AS "itemsCount"
             FROM users u
             LEFT JOIN business_type bt ON u.business_type_id = bt.id AND bt.is_deleted = false
             LEFT JOIN company c ON u.company_id = c.id AND c.is_deleted = false
             ${whereClause}
             ORDER BY ${sortField} ${order}
             LIMIT :limit OFFSET :offset
         `;

        const users = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });

        const countQuery = `
            SELECT COUNT(*) AS "totalUsers"
            FROM users u
            LEFT JOIN company c ON u.company_id = c.id AND c.is_deleted = false
            ${whereClause}`;

        const countResult = await sequelize.query(countQuery, {
            replacements,
            type: sequelize.QueryTypes.SELECT,
            raw: true,
        });
        
        const totalUsers = Number(countResult[0]?.totalUsers) || 0;

        return res.status(HTTP_STATUS_CODE.OK).json({
            status: HTTP_STATUS_CODE.OK,
            message: totalUsers > 0 ? "Users retrieved successfully." : "No users found.",
            data: totalUsers > 0 ? { total: totalUsers, users } : null,
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
