const express = require("express");
const router = express.Router();
const SubAdminController = require("../../controller/adminmanage/SubAdminController");
const authMiddleware = require("../../middleware/authMiddleware");
const { upload } = require("../../../config/multer");

router.post("/create", authMiddleware, upload.single("image"), SubAdminController.createSubAdmin);
router.get("/get/:subAdminId", authMiddleware, SubAdminController.getSubAdminById);
router.post("/update", authMiddleware, upload.single("image"), SubAdminController.updateSubAdmin);
router.post("/toggle-status/:subAdminId", authMiddleware, SubAdminController.toggleSubAdminStatus);
router.post("/delete/:subAdminId", authMiddleware, SubAdminController.deleteSubAdmin);

module.exports = router;
