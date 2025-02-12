const express = require("express");
const router = express.Router();
const UserController = require("../../controller/user/UserController");
const authMiddleware = require("../../middleware/authMiddleware");
const {upload} = require('../../../config/multer')

router.get("/get-all",authMiddleware,UserController.getAllUsers);
router.post("/edit-profile",authMiddleware,upload.single("image"),UserController.editUser)
router.post("/toggle-status/:userId",authMiddleware,UserController.toggleUserStatus)
router.post("/delete/:userId",authMiddleware,UserController.deleteUser)

module.exports = router;