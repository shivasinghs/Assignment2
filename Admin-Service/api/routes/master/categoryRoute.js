const express = require("express");
const router = express.Router();
const CategoryController = require("../../controller/master/CategoryController");
const authMiddleware = require("../../middleware/authMiddleware");
const {upload} = require('../../../config/multer')

router.post("/add", authMiddleware,upload.single("logo"), CategoryController.createCategory);
router.get("/get/:categoryId", authMiddleware, CategoryController.getCategoryById);
router.get("/getall", authMiddleware, CategoryController.getAllCategories);
router.post("/update", authMiddleware,upload.single("logo"), CategoryController.updateCategory);
router.post("/delete/:categoryId", authMiddleware, CategoryController.deleteCategory);

module.exports = router;
