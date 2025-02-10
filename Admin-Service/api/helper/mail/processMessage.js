const PATH = require('path');

const processMessage = (type) => {
  let subject = '';
  let attachments = [];

  switch (type) {
    case 'signup':
      subject = 'Welcome to our platform!';
      attachments = [ ];
      break;

    case 'reset-your-password':
      subject = 'Reset Your Password';
      attachments = [];
      break;

    case 'create-sub-admin':  
      subject = 'You have been invited as a Sub-Admin';
      break;

    default:
      console.warn(`No specific configuration for email type: ${type}`);
  }

  return { subject, attachments };
};

module.exports = processMessage;
