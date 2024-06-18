const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'pending'],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Customer = mongoose.model('Customer', customerSchema);

module.exports = {
  Customer: Customer,
};

