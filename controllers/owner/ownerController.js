const { errorHandling } = require('../../middlewares/errorHandling');
const { Owner } = require('../../models/Owner');
const { updateToken } = require('../../core/updateToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP } = require('../../core/otpGenerator');
const moment = require('moment');
const { sendMail } = require('../../core/emailService');

exports.getAllOwners = async (_, res) => {
  let owners;

  try {
    owners = await Owner.find();
  } catch (err) {
    console.log(err);
  }
  if (!owners) {
    errorHandling(`400|No owners found.|`);
  }
  return res.status(200).json({
    statusCode: 200,
    data: owners,
  });
};

exports.addOwner = async (req, res, next) => {
  try {
    const { email, fullName, password } = req.body;

    if (!email) {
      errorHandling(`400|Please provide email.|`);
    }
    if (!fullName) {
      errorHandling(`400|Please provide full name.|`);
    }
    if (!password) {
      errorHandling(`400|Please provide full password.|`);
    }

    const existingOwner = await Owner.findOne({ email: email });

    if (existingOwner) {
      errorHandling(`401|Owner with email, ${email} already exists.|`);
    } else {
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const hashedPassword = await bcrypt.hash(password, salt);

      const newOwner = new Owner({
        email: email,
        fullName: fullName,
        password: hashedPassword,
      });

      await newOwner.save();

      const token = jwt.sign(
        {
          _id: newOwner._id,
        },
        process.env.TOKEN,
        {
          expiresIn: '7d',
        },
      );

      await updateToken(newOwner._id, token, 'Owner');

      const createdOwner = await Owner.findOne({
        email: email,
      }).select(`-password`);

      return res.status(200).json({
        statusCode: 200,
        message: `Welcome, Boss ${fullName}`,
        data: createdOwner,
        token: token,
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.ownerLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) errorHandling(`400|Please provide email.|`);
    if (!password) errorHandling(`400|Please provide password.|`);

    const existingOwner = await Owner.findOne({ email });

    if (!existingOwner) {
      errorHandling(`400|Owner Doesn't Exist.|`);
    }

    const isMatch = await bcrypt.compare(password, existingOwner.password);

    if (!isMatch) {
      errorHandling(`400|Incorrect Password.|`);
    } else {
      const token = jwt.sign(
        {
          _id: existingOwner._id,
        },
        process.env.TOKEN,
        {
          expiresIn: '7d',
        },
      );

      await updateToken(existingOwner._id, token);

      res.status(200).json({
        statusCode: 200,
        message: 'Login Successful',
        token: token,
        data: existingOwner,
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.resendOwnerOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      errorHandling(`400|Please provide email.|`);
    }

    const existingOwner = await Owner.findOne({ email: email });

    if (!existingOwner) {
      errorHandling(`404|Owner not found.|`);
    } else {
      const emailOtp = generateOTP();
      const emailOtpExpiration = moment().add(15, 'minutes');

      await Owner.findOneAndUpdate({ email }, { emailOtp, emailOtpExpiration });

      // subject, email, type, data
      await sendMail('Password Reset OTP', email, 'otp', { emailOtp });

      return res.status(200).json({
        statusCode: 200,
        message: 'OTP Sent',
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.requestOwnerPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      errorHandling(`400|Please provide email.|`);
    }

    const existingOwner = await Owner.findOne({ email: email });

    if (!existingOwner) {
      errorHandling(`404|Owner not found.|`);
    } else {
      const emailOtp = generateOTP();
      const emailOtpExpiration = moment().add(15, 'minutes');

      await Owner.findOneAndUpdate({ email }, { emailOtp, emailOtpExpiration });

      // subject, email, type, data
      await sendMail('Password Reset OTP', email, 'otp', { emailOtp })
        .then(() => {
          res.status(200).json({
            statusCode: 200,
            message: 'Initialized Password Reset',
          });
        })
        .catch((e) => {
          console.log(e);
          errorHandling(`409|Error sending mail|`);
        });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.resetOwnerPassword = async (req, res, next) => {
  try {
    const { otp, password } = req.body;

    if (!otp) {
      errorHandling(`400|Please provide otp.|`);
    }
    if (!password) {
      errorHandling(`400|Please provide password.|`);
    }

    const existingOwner = await Owner.findOne({ emailOtp: otp });

    if (!existingOwner) {
      errorHandling(`400|OTP is Invalid.|`);
    }

    const emailOtpExpiration = existingOwner.emailOtpExpiration;
    const expirationMoment = moment(emailOtpExpiration);

    if (moment().isAfter(expirationMoment)) {
      errorHandling(`400|OTP has Expired.|`);
    } else {
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const hashedPassword = await bcrypt.hash(password, salt);

      await Owner.findOneAndUpdate(
        { email: existingOwner.email },
        {
          emailOtp: null,
          emailOtpExpiration: null,
          password: hashedPassword,
        },
      );

      const updatedOwner = await Owner.findOne({ email: existingOwner.email });

      // subject, email, type, data
      await sendMail('Password Reset', updatedOwner.email, 'password-reset', {
        userName: updatedOwner.fullName,
      })
        .then(() => {
          res.status(200).json({
            statusCode: 200,
            message: 'Password Reset Successfully',
            data: updatedOwner,
          });
        })
        .catch((e) => {
          console.log(e);
          errorHandling(`409|Error sending mail|`);
        });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.deleteOwner = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      errorHandling(`400|No email detected.|`);
    }

    const existingOwner = await Owner.findOne({ email });

    if (!existingOwner) {
      errorHandling(`404|Owner not found.|`);
    } else {
      await Owner.deleteOne({ email });

      return res.status(200).json({
        statusCode: 200,
        message: 'Owner deleted successfully',
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

