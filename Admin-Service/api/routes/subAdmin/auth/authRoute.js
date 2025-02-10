const AuthController = require("../../../controller/subAdmin/auth/AuthController")
const express = require("express")
const router = express.Router()

router.post("/login", AuthController.subAdminLogin)

module.exports = router
