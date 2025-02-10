const express = require("express")
const router = express.Router()
const superAdminAuthRoute = require("./superAdmin/auth/authRoute")
const subAdminAuthRoute = require("./subAdmin/auth/authRoute")
const subAdminRoute = require("./superAdmin/master/subAdminRoute")
const businessTypeRoute = require('./master/businessTypeRoute')
const itemTypeRoute = require('./master/itemTypeRoute')
const categoryRoute = require('./master/categoryRoute')

router.use("/super-admin", superAdminAuthRoute)
router.use("/sub-admin", subAdminAuthRoute)
router.use("/sub-admin", subAdminRoute)
router.use("/business-type",businessTypeRoute)
router.use("/item-type",itemTypeRoute)
router.use("/category",categoryRoute)

module.exports = router
