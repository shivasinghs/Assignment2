const PATH = require('path');

const processMessage = (type) => {
  let subject = '';
  let attachments = [];

  switch (type) {
    case 'account-verification':
      subject = 'Welcome to our platform!';
      attachments = [];
      break;

    case 'otp-for-resetting-your-password':
      subject = 'Reset Your Password';
      attachments = [];
      break;

      case 'create-employee':
      subject = 'You have been added as an Employee ';
      attachments = [];
      break;
    default:
      console.warn(`No specific configuration for email type: ${type}`);
  }

  return { subject, attachments };
};

module.exports = processMessage;

