const { MAIL_TYPES, PATH } = require("../../../config/constants");

/**
 Processes the email message configuration based on the type.
 type - The type of email to be sent.
 */

const processMessage = (type) => {
  let subject = ''; // Default subject
  let attachments = []; // Default attachments array

  switch (type) {
    case 'signup':
      subject = 'Welcome to our platform!';
      attachments = [];
      break;

    case 'reset-your-password':
      subject = 'Reset Your Password';
      attachments = [];
      break;

    case MAIL_TYPES.CREATE_SUB_ADMIN:
      subject = 'You have been invited as a Sub-Admin';
      break;

    default:
      console.warn(`No specific configuration for email type: ${type}`);
  }

  return { subject, attachments };
};

module.exports = processMessage;
