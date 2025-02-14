const JWT = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const VALIDATOR = require('validatorjs');
const BCRYPT = require('bcryptjs');
const { Op } = require('sequelize');
const PATH = require('path');
const FS = require('fs');
const MULTER = require('multer');
const NODEMAILER = require('nodemailer');

// HTTP status codes used in responses
const HTTP_STATUS_CODE = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    SERVER_ERROR: 500,
};

// Token expiry durations
const TOKEN_EXPIRY = 60 * 60; //  3600 seconds (1 Hour)
const TOKEN_EXPIRY_DAY = 24 * 60 * 60; // 24 hours in seconds

// User roles for access control
const USER_ROLES = {
  OWNER: "owner",
  EMPLOYEE: "employee"
};

// Mail types for different email templates
const MAIL_TYPES = {
  CREATE_EMPLOYEE: "create-employee",
  ACCOUNT_VERIFICATION : "account-verification",
  OTP_FOR_RESETTING_YOUR_PASSWORD : "otp-for-resetting-your-password",
  ITEM_COUNT_TO_OWNER : "item-count-to-owner",
};

// Mail templates used in email notifications
const MAIL_TEMPLATES = {
  VERIFY_ACCOUNT : "verify-account",
  EMPLOYEE_INVITE: "employee-invite",
  ITEM_COUNT : "item-count",
  FORGOT_PASSWORD : "forgot-password",
};

module.exports = {
  JWT,
  uuidv4,
  VALIDATOR,
  BCRYPT,
  Op,
  HTTP_STATUS_CODE,
  TOKEN_EXPIRY,
  TOKEN_EXPIRY_DAY,
  PATH,
  FS,
  MULTER,
  NODEMAILER,
  USER_ROLES,
  MAIL_TYPES,
  MAIL_TEMPLATES,
};
