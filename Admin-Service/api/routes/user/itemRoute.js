const express = require("express");
const router = express.Router();
const ItemController = require("../../controller/user/ItemController");
const authMiddleware = require("../../middleware/authMiddleware");
const {upload} = require('../../../config/multer')

router.get("/get-all",authMiddleware,ItemController.getAllItems);
router.post("/update", authMiddleware, upload.single("image"), ItemController.updateItem);
router.post("/delete/:itemId", authMiddleware, ItemController.deleteItem);
router.post("/toggle/:itemId", authMiddleware, ItemController.deactivateItem);

module.exports = router;