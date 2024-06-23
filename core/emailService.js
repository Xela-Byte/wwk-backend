const { createTransport } = require('nodemailer');

// Load Email Templates
const { welcomeEmailTemplate } = require('../templates/onboarding.template');
const { otpEmailTemplate } = require('../templates/otp.template');
const { broadcastTemplate } = require('../templates/broadcast.template');
const {
  passwordResetTemplate,
} = require('../templates/passwordReset.template');
const { pickupEmailTemplate } = require('../templates/pickup.template');

// For Gmail
const options = {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME, // your Zoho email address
    pass: process.env.MAIL_PASSWORD, // your Zoho email password
  },
};

transporter = createTransport(options);

const sendMail = async (subject, email, type, data) => {
  html = '';

  if (type === 'onboarding') {
    html = welcomeEmailTemplate();
  }
  if (type === 'broadcast') {
    // title: any, leaderName: any, role: any
    html = broadcastTemplate(
      `${data.title}`,
      `${data.leaderName}`,
      `${data.role}`,
      `${data.message}`,
    );
  }
  if (type === 'otp') {
    html = otpEmailTemplate(`${data.emailOtp}`);
  }
  if (type === 'pickup') {
    html = pickupEmailTemplate(`${data.fullName}`, `${data.orderNumber}`);
  }
  if (type === 'password-reset') {
    html = passwordResetTemplate(`${data.userName}`);
  }
  const mailOptions = {
    from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
    [type === 'broadcast' ? 'bcc' : 'to']: `${email}`,
    subject: subject,
    html: html,
    ...(type === 'broadcast' && data.image
      ? {
          attachments: [
            {
              filename: 'image.png',
              content: data.image.split('base64,')[1],
              encoding: 'base64',
            },
          ],
        }
      : {}),
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = {
  sendMail,
};

