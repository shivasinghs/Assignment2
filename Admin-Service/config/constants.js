const JWT = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const VALIDATOR = require('validatorjs');
const BCRYPT = require('bcryptjs');
const { Op } = require('sequelize');
const PATH = require('path')
const FS = require('fs');
const MULTER = require('multer')
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

// Admin roles for access control
const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  SUB_ADMIN: "sub_admin"
};

// User roles for access control
const USER_ROLES = {
  OWNER: "owner",
  EMPLOYEE: "employee"
};

// Mail types for different email templates
MAIL_TYPES = {
  CREATE_SUB_ADMIN : "create-sub-admin",
}

// Mail templates used in email notifications
MAIL_TEMPLATES = {
  SUB_ADMIN_INVITE : "sub-admin-invite",
}

module.exports = {
    JWT,
    uuidv4,
    VALIDATOR,
    BCRYPT,
    Op,
    HTTP_STATUS_CODE,
    TOKEN_EXPIRY,
    PATH,
    FS,
    MULTER,
    NODEMAILER,
    ADMIN_ROLES,
    USER_ROLES,
    MAIL_TYPES,
    MAIL_TEMPLATES,
};