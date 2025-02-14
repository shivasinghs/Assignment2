const transporter = require('../../../config/nodemailer');
const processMessage = require('./processMessage');
const processTemplate = require('./processTemplate');

/**
  Sends an email using Nodemailer.
  from - Sender's email address.
  to - Recipient's email address.
  type - Type of email (e.g., signup, reset-your-password).
  templateName - Name of the Handlebars template (without extension).
  payload - Data to populate in the template.
 */

const sendEmail = async (from, to, type, templateName, payload) => {
  try {
    // Get subject and attachments based on email type
    const { subject, attachments } = processMessage(type);

    // Generate HTML content using the template
    const html = processTemplate(templateName, payload);
    if (!html) throw new Error('Template processing failed');

    // Define email options
    const mailOptions = {
      from,
      to,
      subject,
      html,
      attachments,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
