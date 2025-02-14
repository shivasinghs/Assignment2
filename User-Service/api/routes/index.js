const express = require('express');
const router = express.Router();
const usersAuthRoutes = require('./auth/authRoute')
const ownerRoute = require('./owner/auth/authRoute');
const employeeRoute = require('./employeemanage/employeeRoute')
const employeePersonalRoute = require('./employeepersonal/employeeRoute')
const companyRoute = require('./company/companyRoute')
const itemRoute = require('./item/itemRoute')
const dropdownRoute = require('./dropdown/dropdownRoute')

//login route for  for both users
router.use('/user',usersAuthRoutes)

// owner routes for signup , verification, forgotpassword , resetpassword
router.use('/owner', ownerRoute);

// owner creates employee , employee -> create, getemployeeByid, update, deactivate, delete
router.use('/employee', employeeRoute);

//employee personal route for update and get profile
router.use('/employee-personal', employeePersonalRoute);

//company route for update,get by owner
router.use('/company', companyRoute);

//item routes -> create, getbyid , update, delete , getall
router.use("/item",itemRoute)

//dropdown routes -> getallbussinesstype , getallitemtype , getallcategory
router.use("/dropdown",dropdownRoute)

module.exports = router;