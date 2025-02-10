const { superAdminLogin } = require("../../../controller/superAdmin/auth/AuthController")
const express = require("express")
const router = express.Router()

router.post("/login", superAdminLogin)

module.exports = router
