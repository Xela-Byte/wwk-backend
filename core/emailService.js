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
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASS,
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
    from: `Wash With Kings ${process.env.EMAIL_USERNAME}`,
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

