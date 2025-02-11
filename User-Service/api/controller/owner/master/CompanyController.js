const { Company } = require("../../../models/index"); 
const {  HTTP_STATUS_CODE, USER_ROLES, VALIDATOR } = require("../../../../config/constants");
const validationRules = require("../../../../config/validationRules");
const deleteImage = require("../../../helper/imageHandler/delete");
// const sequelize = require('../../../../config/sequelize');


const updateCompany = async (req, res) => {
    try {
      const { companyId, name, description, removeLogo } = req.body;
      const owner = req.user;
      const logo = req.file;
      const baseUrl = `${req.protocol}://${req.get("host")}/assets/uploads/`;
  
      const validation = new VALIDATOR(req.body, {
        companyId : validationRules.Company.id,
        name: validationRules.Company.name,
        description: validationRules.Company.description,
      });
  
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          status: HTTP_STATUS_CODE.BAD_REQUEST,
          message: "Invalid input.",
          err: validation.errors.all(),
        });
      }
  
      if (owner.role !== USER_ROLES.OWNER) {
        return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
          status: HTTP_STATUS_CODE.FORBIDDEN,
          message: "You do not have permission to update this company's details.",
        });
      }
  
      const company = await Company.findOne({
        where: { id: companyId, ownerId: owner.id, isActive: true, isDeleted: false },
      });
  
      if (!company) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          status: HTTP_STATUS_CODE.NOT_FOUND,
          message: "Company not found or has been deleted or you don't own it.",
        });
      }
  
      let logoPath = company.logo;
  
      if (logo) {
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!allowedTypes.includes(logo.mimetype) || logo.size > 2 * 1024 * 1024) {
          deleteImage(logo.path);
          return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
            status: HTTP_STATUS_CODE.BAD_REQUEST,
            message: "Invalid logo. Only PNG, JPEG, JPG allowed & max size 2MB.",
          });
        }
  
        if (logoPath) {
          deleteImage(logoPath.replace(baseUrl, ""));
        }
        logoPath = baseUrl + logo.filename;
      }
  
      if (removeLogo === "true" && logoPath) {
        deleteImage(company.logo.replace(baseUrl, ""));
        logoPath = null;
      }
  
      await company.update({
        name: name || company.name,
        description: description || company.description,
        logo: logoPath,
        updatedAt: Math.floor(Date.now() / 1000),
        updatedBy: owner.id,
      });
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        status: HTTP_STATUS_CODE.OK,
        message: "Company updated successfully.",
        data: { companyId },
      });
    } catch (error) {
      console.error("Error in updateCompany:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        status: HTTP_STATUS_CODE.SERVER_ERROR,
        message: "Internal server error.",
        err: error.message,
      });
    }
  };


const getCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const owner = req.user;
    
    const company = await Company.findOne({
      where: { id: companyId,ownerId: owner.id, isActive: true, isDeleted: false },
      attributes: ['id', 'name', 'description', 'logo'], 
    });

    if (!company) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        status: HTTP_STATUS_CODE.NOT_FOUND,
        message: "Company not found or has been deleted.",
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      status: HTTP_STATUS_CODE.OK,
      data: company, 
    });
  } catch (error) {
    console.error("Error in getCompany:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      status: HTTP_STATUS_CODE.SERVER_ERROR,
      message: "Internal server error.",
      err: error.message,
    });
  }
};


module.exports = { updateCompany, getCompany };