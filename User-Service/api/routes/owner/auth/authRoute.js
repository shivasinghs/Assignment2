const express = require("express")
const router = express.Router()
const AuthController = require("../../../controller/owner/auth/AuthController")

router.post("/signup", AuthController.signup)
router.post("/verify-account",AuthController.verifyAccount);
router.post("/forgot-password",AuthController.forgotPassword)
router.post("/reset-password",AuthController.resetPassword)
// router.post("/update-profile",userAuthMiddleware,upload.single("image"), userController.updateProfile)
// router.get("/get-profile",userAuthMiddleware, userController.getProfile)

module.exports = router