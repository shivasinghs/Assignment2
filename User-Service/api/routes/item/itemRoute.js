const express = require("express");
const router = express.Router();
const ItemController = require("../../controller/item/ItemController");
const authMiddleware = require("../../middleware/authMiddleware");
const { upload } = require("../../../config/multer");

router.post("/add", authMiddleware,upload.single("image"), ItemController.createItem);
router.get("/get/:itemId", authMiddleware, ItemController.getItemById);
router.get("/getall", authMiddleware, ItemController.getAllItems);
router.post("/update", authMiddleware, upload.single("image"), ItemController.updateItem);
router.post("/delete/:itemId", authMiddleware, ItemController.deleteItem);

module.exports = router;