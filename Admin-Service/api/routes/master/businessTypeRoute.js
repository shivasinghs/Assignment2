const express = require("express");
const router = express.Router();
const BusinessTypeController = require("../../controller/master/BusinessTypeController");
const authMiddleware = require("../../middleware/authMiddleware");

router.post("/add", authMiddleware, BusinessTypeController.createBusinessType);
router.get("/get/:businessTypeId", authMiddleware, BusinessTypeController.getBusinessTypeById);
router.get("/getall", authMiddleware, BusinessTypeController.getAllBusinessTypes);
router.post("/update", authMiddleware,BusinessTypeController.updateBusinessType);
router.post("/delete/:businessTypeId", authMiddleware, BusinessTypeController.deleteBusinessType);

module.exports = router;
