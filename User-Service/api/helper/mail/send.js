const transporter = require('../../../config/nodemailer')
const processMessage = require('./processMessage')
const processTemplate = require('./processTemplate')

const sendEmail = async (to, type,templateName, payload) => {
  try {

    const { subject, attachments } = processMessage(type);

    const html = processTemplate(templateName, payload);
    if (!html) throw new Error('Template processing failed');

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail
