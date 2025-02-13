const express = require("express");
const router = express.Router();
const DropdownController = require("../../controller/master/DropdownController");
const authMiddleware = require("../../middleware/authMiddleware");

router.get("/get-all-business-type", authMiddleware,DropdownController.getAllBusinessTypes );
router.get("/get-all-item-type", authMiddleware,DropdownController.getAllItemTypes );
router.get("/get-all-category", authMiddleware,DropdownController.getAllCategories );

module.exports = router;