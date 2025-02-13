const express = require('express');
const router = express.Router();
const ownerAuthRoute = require('./owner/auth/authRoute');
const employeeRoute = require('./owner/master/employeeRoute')
const employeePersonalRoute = require('./employee/employeeRoute')
const companyRoute = require('./owner/master/companyRoute')
const itemRoute = require('./master/itemRoute')
const dropdownRoute = require('./master/dropdownRoute')

router.use('/user', ownerAuthRoute);
router.use('/employee', employeeRoute);
router.use('/employee-personal', employeePersonalRoute);
router.use('/company', companyRoute);
router.use("/item",itemRoute)
router.use("/dropdown",dropdownRoute)

module.exports = router;