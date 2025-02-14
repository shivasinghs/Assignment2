const { MAIL_TYPES, PATH } = require("../../../config/constants");
/**
 Processes the email message configuration based on the type.
 type - The type of email to be sent.
 */

const processMessage = (type) => {
  let subject = ''; // Default subject
  let attachments = []; // Default attachments array

  switch (type) {
    case MAIL_TYPES.ACCOUNT_VERIFICATION:
      subject = 'Welcome to our platform!';
      attachments = [];
      break;

    case MAIL_TYPES.OTP_FOR_RESETTING_YOUR_PASSWORD:
      subject = 'Reset Your Password';
      attachments = [];
      break;

      case MAIL_TYPES.CREATE_EMPLOYEE:
      subject = 'You have been added as an Employee ';
      attachments = [];
      break;

      case MAIL_TYPES.ITEM_COUNT_TO_OWNER:
      subject = 'List Of Items Created Today';
      attachments = [];
      break;
    default:
      console.warn(`No specific configuration for email type: ${type}`);
  }

  return { subject, attachments };
};

module.exports = processMessage;

