const express = require("express");
const router = express.Router();
const ItemController = require("../../controller/user/ItemController");
const authMiddleware = require("../../middleware/authMiddleware");
const {upload} = require('../../../config/multer')

router.get("/get-all",authMiddleware,ItemController.getAllItems);
router.post("/update", authMiddleware, upload.single("image"), ItemController.updateItemByAdmin);
router.post("/delete/:itemId", authMiddleware, ItemController.deleteItemByAdmin);
router.post("/toggle/:itemId", authMiddleware, ItemController.deactivateItemByAdmin);

module.exports = router;