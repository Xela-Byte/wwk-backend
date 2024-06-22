const { generateOrderNumber } = require('../../core/otpGenerator');
const { errorHandling } = require('../../middlewares/errorHandling');
const { Customer } = require('../../models/Customer');
const { Pickup } = require('../../models/Pickup');
const { Notification } = require('../../models/Notification');
const { Owner } = require('../../models/Owner');
const { Admin } = require('../../models/Admin');
const { default: mongoose } = require('mongoose');
const { sendMail } = require('../../core/emailService');

exports.getAllPickups = async (req, res) => {
  let pickups;
  const limit = parseInt(req.query.limit, 10) || 5;
  const page = parseInt(req.query.page, 10) || 1;
  const pickupStatus = req.query.status || 'completed';
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
            { orderNumber: { $regex: searchQuery, $options: 'i' } },
          ],
        }
      : {};

    // Combine status filter with search criteria
    const filterCriteria = {
      status: pickupStatus,
      ...searchCriteria,
    };

    // Get the total number of customers with the specified status and search criteria
    const totalFilteredPickups = await Pickup.countDocuments(filterCriteria);

    const totalPickups = await Pickup.countDocuments();

    // Calculate the number of customers to skip
    const skip = (page - 1) * limit;

    // Query to get the customers with pagination, sorting, and search
    pickups = await Pickup.find(filterCriteria)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Determine if there is a next page
    const isNextPage = page * limit < totalFilteredPickups;

    const totalPages = Math.ceil(totalFilteredPickups / limit);

    // Return the paginated response
    return res.status(200).json({
      statusCode: 200,
      data: pickups,
      currentPage: page,
      totalLength: searchQuery ? totalFilteredPickups : totalPickups,
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

exports.getPickupsLength = async (_, res) => {
  let pickups;

  try {
    pickups = await Pickup.countDocuments();
    if (!pickups) {
      errorHandling(`400|No pickups found.|`);
    } else {
      const pickupData = await Pickup.find({}).sort({ createdAt: -1 }).limit(5);

      return res.status(200).json({
        statusCode: 200,
        length: pickups,
        data: pickupData,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.getPickupByID = async (req, res, next) => {
  const { orderID } = req.query;

  if (!orderID) {
    errorHandling(`400|Please provide order ID.|`);
  }

  const isValidObjectId = mongoose.Types.ObjectId.isValid(orderID);

  if (!isValidObjectId) {
    errorHandling(`400|Invalid Order ID.|`);
  }

  const specificPickup = await Pickup.findById(orderID);

  if (!specificPickup) {
    errorHandling(`404|Pickup not found.|`);
  } else {
    return res.status(200).json({
      statusCode: 200,
      data: specificPickup,
      message: 'Pickup found.',
    });
  }
};

exports.addPickup = async (req, res, next) => {
  try {
    const { email, fullName, address, phoneNumber, date, comment } = req.body;

    if (!email) {
      errorHandling(`400|Please provide email.|`);
    }
    if (!fullName) {
      errorHandling(`400|Please provide full name.|`);
    }
    if (!phoneNumber) {
      errorHandling(`400|Please provide phone number.|`);
    }
    if (!address) {
      errorHandling(`400|Please provide address.|`);
    }
    if (!date) {
      errorHandling(`400|Please provide date.|`);
    }
    if (!comment) {
      errorHandling(`400|Please provide comment.|`);
    }

    const existingCustomer = await Customer.findOne({ email: email });

    if (!existingCustomer) {
      const newCustomer = new Customer({
        email: email,
        fullName: fullName,
        address,
        phoneNumber,
        status: 'pending',
      });

      await newCustomer.save();
    }

    const orderNumber = generateOrderNumber();

    const newPickup = new Pickup({
      email: email,
      fullName: fullName,
      address,
      phoneNumber,
      date,
      comment,
      status: 'pending',
      orderNumber,
    });

    await newPickup.save();

    const createdPickup = await Pickup.findById(newPickup._id);

    const newNotification = new Notification({
      title: 'You have received a pick-up order',
      message: `${fullName} has requested for a pickup, order number is ${orderNumber}`,
      orderID: newPickup._id,
      read: false,
      type: 'order',
    });

    await newNotification.save();

    const emailData = {
      fullName,
      orderNumber,
    };

    await sendMail('Pickup Order', email, 'pickup', emailData);

    return res.status(200).json({
      statusCode: 200,
      message: `${!existingCustomer ? `New Customer - ${fullName} created.` : ''} Pickup order - ${orderNumber} created`,
      data: createdPickup,
    });
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.markPickupAsComplete = async (req, res, next) => {
  try {
    const { email } = req.query;
    const { orderNumber } = req.body;

    if (!email) {
      errorHandling(`400|No email detected.|`);
    }

    if (!orderNumber) {
      errorHandling(`400|Please provide order number.|`);
    }

    const existingOwner = await Owner.findOne({ email: email });
    const existingAdmin = await Admin.findOne({ email: email });

    if (!existingAdmin && !existingOwner) {
      errorHandling(`409|Not authorized.|`);
    } else {
      await Pickup.findOneAndUpdate(
        { orderNumber },
        {
          status: 'completed',
        },
      );

      const completedOrder = await Pickup.findOne({ orderNumber });

      await Customer.findOneAndUpdate(
        {
          email: completedOrder.email,
        },
        {
          status: 'active',
        },
      );

      return res.status(200).json({
        statusCode: 200,
        message: 'Order complete.',
        data: completedOrder,
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.deletePickup = async (req, res, next) => {
  try {
    const { ownerEmail } = req.query;

    const { orderNumber } = req.body;

    if (!ownerEmail) {
      errorHandling(`400|Please provide owner email.|`);
    }

    if (!orderNumber) {
      errorHandling(`400|Please provide order number.|`);
    }

    const existingOwner = await Owner.findOne({ email: ownerEmail });
    const existingPickup = await Pickup.findOne({ orderNumber });

    if (!existingOwner) {
      errorHandling(`409|Not authorized.|`);
    }
    if (!existingPickup) {
      errorHandling(`404|Pickup not found.|`);
    } else {
      await Pickup.deleteOne({ orderNumber });

      return res.status(200).json({
        statusCode: 200,
        message: 'Pickup deleted successfully',
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

