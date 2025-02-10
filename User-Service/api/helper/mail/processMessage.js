const PATH = require('path');

const processMessage = (type) => {
  let subject = '';
  let attachments = [];

  switch (type) {
    case 'signup':
      subject = 'Welcome to our platform!';
      attachments = [
        {
                filename: "signup.jpeg",
                path: PATH.join(__dirname, "../../../public/assets/images/signup.jpeg"),
                cid: "signup"
              },
              {
                filename: "usersignup.jpeg",
                path: PATH.join(__dirname, "../../../public/assets/images/usersignup.jpeg")
              }
      ];
      break;

    case 'reset-your-password':
      subject = 'Reset Your Password';
      attachments = [
        {
                filename: "download.jpeg",
                path: PATH.join(__dirname, "../../../public/assets/images/download.jpeg"),
                cid: "img1"
              }
      ];
      break;

    default:
      console.warn(`No specific configuration for email type: ${type}`);
  }

  return { subject, attachments };
};

module.exports = processMessage;
