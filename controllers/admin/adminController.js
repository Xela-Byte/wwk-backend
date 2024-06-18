const { errorHandling } = require('../../middlewares/errorHandling');
const { Owner } = require('../../models/Owner');
const { updateToken } = require('../../core/updateToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin } = require('../../models/Admin');
const { generateOTP } = require('../../core/otpGenerator');
const moment = require('moment');
const { sendMail } = require('../../core/emailService');

exports.getAllAdmins = async (_, res) => {
  let admins;

  try {
    admins = await Admin.find();
  } catch (err) {
    console.log(err);
  }
  if (!admins) {
    errorHandling(`400|No admins found.|`);
  }
  return res.status(200).json({
    statusCode: 200,
    data: admins,
  });
};

exports.addAdmin = async (req, res, next) => {
  try {
    const { ownerEmail } = req.query;

    const { email, fullName, password } = req.body;

    if (!ownerEmail) {
      errorHandling(`400|Please provide owner email.|`);
    }

    if (!email) {
      errorHandling(`400|Please provide email.|`);
    }
    if (!fullName) {
      errorHandling(`400|Please provide full name.|`);
    }
    if (!password) {
      errorHandling(`400|Please provide full password.|`);
    }

    const existingOwner = await Owner.findOne({ email: ownerEmail });
    const existingAdmin = await Admin.findOne({ email: email });

    if (!existingOwner) {
      errorHandling(`401|Not authorized to add admin.|`);
    }
    if (existingAdmin) {
      errorHandling(`401|Admin with email, ${email} already exists.|`);
    } else {
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const hashedPassword = await bcrypt.hash(password, salt);

      const newAdmin = new Admin({
        email: email,
        fullName: fullName,
        password: hashedPassword,
      });

      await newAdmin.save();

      const token = jwt.sign(
        {
          _id: newAdmin._id,
        },
        process.env.TOKEN,
        {
          expiresIn: '7d',
        },
      );

      await updateToken(newAdmin._id, token, 'Owner');

      const createdAdmin = await Admin.findOne({
        email: email,
      }).select(`-password`);

      return res.status(200).json({
        statusCode: 200,
        message: `Welcome, Admin ${fullName}`,
        data: createdAdmin,
        token: token,
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) errorHandling(`400|Please provide email.|`);
    if (!password) errorHandling(`400|Please provide password.|`);

    const existingAdmin = await Admin.findOne({ email });

    if (!existingAdmin) {
      errorHandling(`400|Admin Doesn't Exist.|`);
    }

    const isMatch = await bcrypt.compare(password, existingAdmin.password);

    if (!isMatch) {
      errorHandling(`400|Incorrect Password.|`);
    } else {
      const token = jwt.sign(
        {
          _id: existingAdmin._id,
        },
        process.env.TOKEN,
        {
          expiresIn: '7d',
        },
      );

      await updateToken(existingAdmin._id, token);

      res.status(200).json({
        statusCode: 200,
        message: 'Login Successful',
        token: token,
        data: existingAdmin,
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.resendAdminOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      errorHandling(`400|Please provide email.|`);
    }

    const existingAdmin = await Admin.findOne({ email: email });

    if (!existingAdmin) {
      errorHandling(`404|Admin not found.|`);
    } else {
      const emailOtp = generateOTP();
      const emailOtpExpiration = moment().add(15, 'minutes');

      await Admin.findOneAndUpdate({ email }, { emailOtp, emailOtpExpiration });

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

exports.requestAdminPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      errorHandling(`400|Please provide email.|`);
    }

    const existingAdmin = await Admin.findOne({ email: email });

    if (!existingAdmin) {
      errorHandling(`404|Admin not found.|`);
    } else {
      const emailOtp = generateOTP();
      const emailOtpExpiration = moment().add(15, 'minutes');

      await Admin.findOneAndUpdate({ email }, { emailOtp, emailOtpExpiration });

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

exports.resetAdminPassword = async (req, res, next) => {
  try {
    const { otp, password } = req.body;

    if (!otp) {
      errorHandling(`400|Please provide otp.|`);
    }
    if (!password) {
      errorHandling(`400|Please provide password.|`);
    }

    const existingAdmin = await Admin.findOne({ emailOtp: otp });

    if (!existingAdmin) {
      errorHandling(`400|OTP is Invalid.|`);
    }

    const emailOtpExpiration = existingAdmin.emailOtpExpiration;
    const expirationMoment = moment(emailOtpExpiration);

    if (moment().isAfter(expirationMoment)) {
      errorHandling(`400|OTP has Expired.|`);
    } else {
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const hashedPassword = await bcrypt.hash(password, salt);

      await Admin.findOneAndUpdate(
        { email: existingAdmin.email },
        {
          emailOtp: null,
          emailOtpExpiration: null,
          password: hashedPassword,
        },
      );

      const updatedAdmin = await Admin.findOne({ email: existingAdmin.email });

      // subject, email, type, data
      await sendMail('Password Reset', updatedAdmin.email, 'password-reset', {
        userName: updatedAdmin.fullName,
      })
        .then(() => {
          res.status(200).json({
            statusCode: 200,
            message: 'Password Reset Successfully',
            data: updatedAdmin,
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

exports.deleteAdmin = async (req, res, next) => {
  try {
    const { ownerEmail, email } = req.query;

    if (!ownerEmail) {
      errorHandling(`400|Please provide owner email.|`);
    }

    if (!email) {
      errorHandling(`400|No email detected.|`);
    }

    const existingOwner = await Owner.findOne({ email: ownerEmail });
    const existingAdmin = await Admin.findOne({ email: email });

    if (!existingOwner) {
      errorHandling(`404|Owner not found.|`);
    }
    if (!existingAdmin) {
      errorHandling(`404|Admin not found.|`);
    } else {
      await Admin.deleteOne({ email });

      return res.status(200).json({
        statusCode: 200,
        message: 'Admin deleted successfully',
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

