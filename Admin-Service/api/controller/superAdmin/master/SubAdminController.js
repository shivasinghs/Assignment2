const { Admin } = require("../../../models/index")
const { BCRYPT, HTTP_STATUS_CODE, ADMIN_ROLES, VALIDATOR} = require("../../../../config/constants")
const validationRules = require("../../../../config/validationRules")
const sendEmail = require("../../../helper/mail/send")
const deleteImage = require("../../../helper/imageHandler/delete")
const sequelize = require('../../../../config/sequelize')

const createSubAdmin = async (req, res) => {
  try {
    const { name, email, password, gender } = req.body
    const image = req.file
    const superAdmin = req.admin
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`

    const validation = new VALIDATOR(req.body, {
      name: validationRules.Admin.name,
      email: validationRules.Admin.email,
      password: validationRules.Admin.password,
      gender: validationRules.Admin.gender
    })

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all()
      })
    }

    if (superAdmin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action."
      })
    }

    if (email.toLowerCase() === superAdmin.email.toLowerCase()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message:
          "You cannot create a Sub-Admin with the same email as the Super Admin."
      })
    }

    const existingAdmin = await Admin.findOne({
      where: { email , isDeleted: false },
      attributes: ["id"]
    })
    
    if (existingAdmin) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Email already exists."
      })
    }

    let imagePath = null
    if (image) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]
      if (!allowedTypes.includes(image.mimetype) || image.size > 2 * 1024 * 1024) {
        deleteImage(image.path)
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid image. Only PNG, JPEG, JPG allowed & max size 2MB."
        })
      }
      imagePath = baseUrl + image.filename
    }

    const hashedPassword = await BCRYPT.hash(password, 10)
    const newSubAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      gender,
      image: imagePath,
      role: ADMIN_ROLES.SUB_ADMIN,
      createdBy: superAdmin.id
    })

    await sendEmail(
      process.env.EMAIL_FROM,
      newSubAdmin.email,
      "create-sub-admin",
      "sub-admin-invite",
      {
        name: newSubAdmin.name,
        email: newSubAdmin.email,
        password
      }
    )

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      status: HTTP_STATUS_CODE.CREATED,
      message: "Sub-Admin created successfully.",
      data: {
        SubAdminId: newSubAdmin.id
      }
    })
  } catch (error) {
    console.error("Error in createSubAdmin:", error)
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message
    })
  }
}

const getSubAdminById = async (req, res) => {
  try {
    const { subAdminId } = req.params;
    const superAdmin = req.admin;

    const validation = new VALIDATOR(req.params, {
      subAdminId: validationRules.Admin.id,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    if (superAdmin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to view admin details.",
        data: "",
        err: null,
      });
    }

    
    const query = `
      SELECT id, name, email, gender, image, role
      FROM admin
      WHERE id = :subAdminId AND is_deleted = false AND role = :subAdminRole AND is_active = true
    `;

    const [subAdmins] = await sequelize.query(query, {
      replacements: { subAdminId, subAdminRole: ADMIN_ROLES.SUB_ADMIN },
      type: sequelize.QueryTypes.SELECT,
    });

    if (!subAdmins) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Admin not found.",
        data: "",
        err: null,
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Admin details retrieved successfully.",
      data: subAdmins,
      err: null,
    });
  } catch (error) {
    console.error("Error in getSubAdminById:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
      err: error,
    });
  }
};

const updateSubAdmin = async (req, res) => {
  try {
    const { subAdminId, name, email, gender, removeImage } = req.body;
    const superAdmin = req.admin;
    const image = req.file;
    const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;

    const validation = new VALIDATOR(req.body, {
      subAdminId: validationRules.Admin.id,
      name: validationRules.Admin.name,
      email: validationRules.Admin.email,
      gender: validationRules.Admin.gender,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    if (superAdmin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to update a Sub-Admin.",
      });
    }

    if (email && email.toLowerCase() === superAdmin.email.toLowerCase()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Sub-Admin email cannot be the same as Super Admin's email.",
      });
    }

    const subAdmin = await Admin.findOne({
      where: { id: subAdminId, role: ADMIN_ROLES.SUB_ADMIN, isActive: true, isDeleted: false },
      attributes: ["id", "image"],
    });

    if (!subAdmin) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Active Sub-Admin not found or has been deleted.",
      });
    }

    let imagePath = subAdmin.image;

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
      deleteImage(subAdmin.image.replace(baseUrl, ""));
      imagePath = null;
    }

    await subAdmin.update({
      name: name || subAdmin.name,
      email: email || subAdmin.email,
      gender: gender || subAdmin.gender,
      image: imagePath,
      updatedAt: Math.floor(Date.now() / 1000),
      updatedBy: superAdmin.id,
    });

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Sub-Admin updated successfully.",
      data: { subAdminId },
    });
  } catch (error) {
    console.error("Error in updateSubAdmin:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message,
    });
  }
};

const toggleSubAdminStatus = async (req, res) => {
  try {
    const { subAdminId } = req.params;
    const superAdmin = req.admin;

    const validation = new VALIDATOR(req.params, {
      subAdminId: validationRules.Admin.id,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    if (superAdmin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
      });
    }

    const subAdmin = await Admin.findOne({
      where: { id: subAdminId, role: ADMIN_ROLES.SUB_ADMIN, isDeleted : false },
      attributes: ["id", "isActive"],
    });

    if (!subAdmin) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Sub-Admin not found.",
      });
    }

    subAdmin.isActive = !subAdmin.isActive;
    subAdmin.updatedAt = Math.floor(Date.now() / 1000),
    subAdmin.updatedBy = superAdmin.id,
    await subAdmin.save();

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: `Sub-Admin ${subAdmin.isActive ? "activated" : "deactivated"} successfully.`,
      data: { subAdminId, isActive: subAdmin.isActive },
    });
  } catch (error) {
    console.error("Error in toggleSubAdminStatus:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
    });
  }
};

const deleteSubAdmin = async (req, res) => {
  try {
    const { subAdminId } = req.params
    const superAdmin = req.admin 

    const validation = new VALIDATOR(req.params, {
      subAdminId: validationRules.Admin.id,
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: "Invalid input.",
        err: validation.errors.all(),
      });
    }

    if (superAdmin.role !== ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        status: HTTP_STATUS_CODE.FORBIDDEN,
        message: "You do not have permission to perform this action.",
        data: "",
        err: null
      })
    }
  
    const subAdmin = await Admin.findOne({
      where: { id : subAdminId, role: ADMIN_ROLES.SUB_ADMIN, isDeleted : false },
      attributes : ['id']
    })

    if (!subAdmin) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Sub-Admin not found.",
        data: "",
        err: null
      })
    }

    subAdmin.isDeleted = true
    subAdmin.deletedAt = Math.floor(Date.now() / 1000)
    subAdmin.deletedBy = superAdmin.id,
    await subAdmin.save()

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      message: "Sub-Admin deleted successfully.",
      data: {subAdminId: subAdminId},
      err: null
    })
  } catch (error) {
    console.error("Error in deleteSubAdmin:", error)
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      data: error.message,
      err: error
    })
  }
}

module.exports = {
  createSubAdmin,
  getSubAdminById,
  updateSubAdmin,
  toggleSubAdminStatus,
  deleteSubAdmin
}
