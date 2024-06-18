const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pickupSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
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
    date: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'pending'],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Pickup = mongoose.model('Pickup', pickupSchema);

module.exports = {
  Pickup: Pickup,
};

