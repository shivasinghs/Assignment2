const express = require("express");
const router = express.Router();
const EmployeeController = require("../../controller/employeepersonal/EmployeeController");
const authMiddleware = require('../../middleware/authMiddleware')
const { upload } = require("../../../config/multer");

router.get("/get", authMiddleware, EmployeeController.getEmployee);
router.post("/update", authMiddleware, upload.single("image"), EmployeeController.updateEmployee);

module.exports = router;
