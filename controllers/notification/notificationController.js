const { default: mongoose } = require('mongoose');
const { errorHandling } = require('../../middlewares/errorHandling');
const { Admin } = require('../../models/Admin');
const { Notification } = require('../../models/Notification');
const { Owner } = require('../../models/Owner');

exports.getAllNotifications = async (_, res, next) => {
  let notifications;

  try {
    notifications = await Notification.find().sort({ createdAt: -1 });
    if (!notifications) {
      errorHandling(`400|No notifications found.|`);
    }
    return res.status(200).json({
      statusCode: 200,
      data: notifications,
    });
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      errorHandling(`400|Please provide Notification ID.|`);
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

    if (!isValidObjectId) {
      errorHandling(`400|Invalid Notification ID.|`);
    }

    const existingNotification = await Notification.findOne({
      _id: id,
    });

    if (!existingNotification) {
      errorHandling(`409|Notification not found.|`);
    } else {
      await Notification.findOneAndUpdate(
        { _id: id },

        {
          read: true,
        },
      );

      const readNotification = await Notification.findOne({ _id: id });

      return res.status(200).json({
        statusCode: 200,
        message: 'Notification read.',
        data: readNotification,
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const { email } = req.query;
    const { id } = req.params;

    if (!email) {
      errorHandling(`400|No email detected.|`);
    }

    if (!id) {
      errorHandling(`400|Please provide Notification ID.|`);
    }

    const existingOwner = await Owner.findOne({ email: email });

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

    if (!isValidObjectId) {
      errorHandling(`400|Invalid Notification ID.|`);
    }

    const existingNotification = await Notification.findOne({
      _id: id,
    });

    if (!existingOwner) {
      errorHandling(`409|Not authorized.|`);
    }
    if (!existingNotification) {
      errorHandling(`409|Notification not found.|`);
    } else {
      await Notification.findOneAndDelete({ _id: id });

      return res.status(200).json({
        statusCode: 200,
        message: 'Notification deleted.',
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

