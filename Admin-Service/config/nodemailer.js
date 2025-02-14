const {NODEMAILER} = require('./constants');
require('dotenv').config();

//Nodemailer configuration for sending email

const transporter = NODEMAILER.createTransport({
    host: process.env.EMAIL_HOST,
    port: 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

module.exports = transporter;

