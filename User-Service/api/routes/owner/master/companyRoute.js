const express = require("express");
const router = express.Router();
const CompanyController = require("../../../controller/owner/master/CompanyController");
const authMiddleware = require('../../../middleware/authMiddleware')
const { upload } = require("../../../../config/multer");

router.get("/get/:companyId", authMiddleware, CompanyController.getCompany);
router.post("/update", authMiddleware, upload.single("logo"), CompanyController.updateCompany);

module.exports = router;
