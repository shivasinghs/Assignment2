const express = require("express")
const router = express.Router()
const authRoute = require("./auth/authRoute")
const subAdminRoute = require("./adminmanage/subAdminRoute")
const businessTypeRoute = require('./master/businessTypeRoute')
const itemTypeRoute = require('./master/itemTypeRoute')
const categoryRoute = require('./master/categoryRoute')
const userRoute = require('./user/userRoute')
const itemRoute = require('./user/itemRoute')

//login route for super admin and sub-admin
router.use("/admin", authRoute)

//sub admin -> create , getsubadminById , update , deactivate and delete  
router.use("/sub-admin", subAdminRoute)

//business type -> create,getbusinesstypebyid , update, delete, getall 
router.use("/business-type",businessTypeRoute)

//Item type -> create,getItemtypebyid , update, delete, getall 
router.use("/item-type",itemTypeRoute)

//categroy -> create,getcategroybyid , update, delete, getall 
router.use("/category",categoryRoute)

//User -> edit,delete,deactivate,getall
router.use("/users",userRoute)

//Items ->edit, delete, deactivate , getall
router.use("/items",itemRoute)

module.exports = router
