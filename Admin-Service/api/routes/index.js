const express = require("express")
const router = express.Router()
const authRoute = require("./auth/authRoute")
const subAdminRoute = require("./adminmanage/subAdminRoute")
const businessTypeRoute = require('./master/businessTypeRoute')
const itemTypeRoute = require('./master/itemTypeRoute')
const categoryRoute = require('./master/categoryRoute')
const userRoute = require('./user/userRoute')
const itemRoute = require('./user/itemRoute')

router.use("/admin", authRoute)
router.use("/sub-admin", subAdminRoute)
router.use("/business-type",businessTypeRoute)
router.use("/item-type",itemTypeRoute)
router.use("/category",categoryRoute)
router.use("/users",userRoute)
router.use("/items",itemRoute)

module.exports = router
