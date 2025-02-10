const express = require("express");
const router = express.Router();
const ItemTypeController = require("../../controller/master/ItemTypeController");
const authMiddleware = require("../../middleware/authMiddleware");

router.post("/add", authMiddleware, ItemTypeController.createItemType);
router.get("/get/:itemTypeId", authMiddleware, ItemTypeController.getItemTypeById);
router.get("/getall", authMiddleware, ItemTypeController.getAllItemTypes);
router.post("/update", authMiddleware,ItemTypeController.updateItemType);
router.post("/delete/:itemTypeId", authMiddleware, ItemTypeController.deleteItemType);

module.exports = router;