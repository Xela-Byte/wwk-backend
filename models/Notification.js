const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['order', 'message'],
    },
    orderID: {
      type: String,
    },
    messageID: {
      type: String,
    },
    read: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  Notification: Notification,
};

