const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    emailOtp: {
      type: String,
    },
    emailOtpExpiration: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Admin = mongoose.model('Admin', adminSchema);

module.exports = {
  Admin: Admin,
};

