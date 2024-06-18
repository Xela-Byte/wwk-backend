const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ownerSchema = new Schema(
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

const Owner = mongoose.model('Owner', ownerSchema);

module.exports = {
  Owner: Owner,
};

