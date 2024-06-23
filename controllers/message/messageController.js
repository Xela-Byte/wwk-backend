const { default: mongoose } = require('mongoose');
const { Customer } = require('../../models/Customer');
const { Message } = require('../../models/Message');
const { Notification } = require('../../models/Notification');
const { Owner } = require('../../models/Owner');
const { errorHandling } = require('../../middlewares/errorHandling');
const { sendMail } = require('../../core/emailService');
const { Admin } = require('../../models/Admin');

exports.getAllMessages = async (req, res) => {
  let messages;
  const limit = parseInt(req.query.limit, 10) || 5;
  const page = parseInt(req.query.page, 10) || 1;
  const searchQuery = req.query.search || '';

  try {
    if (!limit) {
      return res
        .status(400)
        .json({ statusCode: 400, message: 'Please provide limit' });
    }
    if (!page) {
      return res
        .status(400)
        .json({ statusCode: 400, message: 'Please provide page' });
    }

    // Build the search criteria
    const searchCriteria = searchQuery
      ? {
          $or: [
            { fullName: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } },
            { phoneNumber: { $regex: searchQuery, $options: 'i' } },
          ],
        }
      : {};

    // Combine status filter with search criteria
    const filterCriteria = {
      ...searchCriteria,
    };

    // Get the total number of customers with the specified status and search criteria
    const totalFilteredMessages = await Message.countDocuments(filterCriteria);

    const totalMessages = await Message.countDocuments();

    // Calculate the number of customers to skip
    const skip = (page - 1) * limit;

    // Query to get the customers with pagination, sorting, and search
    messages = await Message.find(filterCriteria)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Determine if there is a next page
    const isNextPage = page * limit < totalFilteredMessages;

    const totalPages = Math.ceil(totalFilteredMessages / limit);

    // Return the paginated response
    return res.status(200).json({
      statusCode: 200,
      data: messages,
      currentPage: page,
      totalLength: searchQuery ? totalFilteredMessages : totalMessages,
      isNextPage: isNextPage,
      totalPages: totalPages,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};

exports.getMessagesLength = async (_, res) => {
  let messages;

  try {
    messages = await Message.countDocuments();
    if (!messages) {
      errorHandling(`400|No messages found.|`);
    } else {
      const messageData = await Message.find({})
        .sort({ createdAt: -1 })
        .limit(5);

      return res.status(200).json({
        statusCode: 200,
        length: messages,
        data: messageData,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.getMessageByID = async (req, res, next) => {
  const { messageID } = req.query;

  if (!messageID) {
    errorHandling(`400|Please provide message ID.|`);
  }

  if (messageID.length !== 24) {
    errorHandling(`400|Invalid Message ID.|`);
  }

  const isValidObjectId = mongoose.Types.ObjectId.isValid(messageID);

  if (!isValidObjectId) {
    errorHandling(`400|Invalid Message ID.|`);
  }

  const specificMessage = await Message.findById(messageID);

  if (!specificMessage) {
    errorHandling(`404|Message not found.|`);
  } else {
    return res.status(200).json({
      statusCode: 200,
      data: specificMessage,
      message: 'Customer found.',
    });
  }
};

exports.addMessage = async (req, res, next) => {
  try {
    const { email, fullName, address, phoneNumber, subject, messageBody } =
      req.body;

    if (!email) {
      errorHandling(`400|Please provide email.|`);
    }
    if (!fullName) {
      errorHandling(`400|Please provide full name.|`);
    }
    if (!phoneNumber) {
      errorHandling(`400|Please provide phone number.|`);
    }
    if (!subject) {
      errorHandling(`400|Please provide subject.|`);
    }
    if (!messageBody) {
      errorHandling(`400|Please provide message body.|`);
    }

    const newMessage = new Message({
      email: email,
      fullName: fullName,
      address,
      phoneNumber,
      subject,
      messageBody,
    });

    await newMessage.save();

    const createdMessage = await Message.findById(newMessage._id);

    const newNotification = new Notification({
      title: 'You have received a new message',
      message: messageBody,
      messageID: newMessage._id,
      read: false,
      type: 'message',
    });

    await newNotification.save();

    return res.status(200).json({
      statusCode: 200,
      message: `Message sent.`,
      data: createdMessage,
    });
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.sendBroadcastMessage = async (req, res, next) => {
  try {
    const { recipients, title, message, leaderEmail, image } = req.body;

    if (!title) {
      errorHandling(`400|Please provide title.|`);
    }
    if (!leaderEmail) {
      errorHandling(`400|Please provide title.|`);
    }
    if (!message) {
      errorHandling(`400|Please provide message.|`);
    }
    if (!recipients) {
      errorHandling(`400|Please provide recipients.|`);
    }
    if (!Array.isArray(recipients)) {
      errorHandling(`400|Invalid recipients data.|`);
    }
    if (recipients.length === 0) {
      errorHandling(`400|No recipients found.|`);
    }

    const existingOwner = await Owner.findOne({ email: leaderEmail });
    const existingAdmin = await Admin.findOne({ email: leaderEmail });

    if (!existingAdmin && !existingOwner) {
      errorHandling(`409|Not authorized.|`);
    } else {
      const recipientsData = recipients.join(',');

      // title: any, leaderName: any, role: any, message: string
      const emailData = {
        title,
        message,
        leaderName: existingOwner
          ? existingOwner.fullName
          : existingAdmin.fullName,
        role: existingOwner ? 'Owner of' : 'Admin at',
        image,
      };

      // (subject: any, email: any, type: any, data: any):
      await sendMail(title, recipientsData, 'broadcast', emailData).then(() => {
        console.log('Broadcast message sent');
      });

      return res.status(200).json({
        statusCode: 200,
        message: 'Broadcast message sent',
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const { ownerEmail } = req.query;

    const { messageID } = req.params;

    if (!ownerEmail) {
      errorHandling(`400|Please provide owner email.|`);
    }

    if (!messageID) {
      errorHandling(`400|Please provide order number.|`);
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(messageID);

    if (!isValidObjectId) {
      errorHandling(`400|Invalid Message ID.|`);
    }

    const existingOwner = await Owner.findOne({ email: ownerEmail });
    const existingMessage = await Message.findOne({ _id: messageID });

    if (!existingOwner) {
      errorHandling(`409|Not authorized.|`);
    }
    if (!existingMessage) {
      errorHandling(`404|Message not found.|`);
    } else {
      await Message.deleteOne({ _id: messageID });

      return res.status(200).json({
        statusCode: 200,
        message: 'Message deleted successfully',
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

