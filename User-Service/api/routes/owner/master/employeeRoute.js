const express = require("express");
const router = express.Router();
const EmployeeController = require("../../../controller/owner/master/EmployeeController");
const authMiddleware = require('../../../middleware/authMiddleware')
const { upload } = require("../../../../config/multer");

router.post("/create", authMiddleware, upload.single("image"), EmployeeController.createEmployee);
router.get("/get/:employeeId", authMiddleware, EmployeeController.getEmployeeById);
router.post("/update", authMiddleware, upload.single("image"), EmployeeController.updateEmployee);
router.post("/toggle-status/:employeeId", authMiddleware, EmployeeController.toggleEmployeeStatus);
router.post("/delete/:employeeId", authMiddleware, EmployeeController.deleteEmployee);

module.exports = router;
