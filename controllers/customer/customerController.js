const mongoose = require('mongoose');
const { errorHandling } = require('../../middlewares/errorHandling');
const { Customer } = require('../../models/Customer');
const { Owner } = require('../../models/Owner');
const { Admin } = require('../../models/Admin');

exports.getAllCustomers = async (req, res) => {
  let customers;
  const limit = parseInt(req.query.limit, 10) || 5;
  const page = parseInt(req.query.page, 10) || 1;
  const customerStatus = req.query.status || 'active';
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
      status: customerStatus,
      ...searchCriteria,
    };

    // Get the total number of customers with the specified status and search criteria
    const totalFilteredCustomers =
      await Customer.countDocuments(filterCriteria);

    const totalCustomers = await Customer.countDocuments({
      status: customerStatus,
    });

    // Calculate the number of customers to skip
    const skip = (page - 1) * limit;

    // Query to get the customers with pagination, sorting, and search
    customers = await Customer.find(filterCriteria)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Determine if there is a next page
    const isNextPage = page * limit < totalFilteredCustomers;

    const totalPages = Math.ceil(totalFilteredCustomers / limit);

    // Return the paginated response
    return res.status(200).json({
      statusCode: 200,
      data: customers,
      currentPage: page,
      totalLength: searchQuery ? totalFilteredCustomers : totalCustomers,
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

exports.getAllCustomersByEmail = async (req, res) => {
  let customers;

  try {
    customers = await Customer.find().select('_id email');

    return res.status(200).json({
      statusCode: 200,
      data: customers,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};

exports.getCustomersLength = async (_, res) => {
  let customers;

  try {
    customers = await Customer.countDocuments();
    if (!customers) {
      errorHandling(`400|No customers found.|`);
    }
    return res.status(200).json({
      statusCode: 200,
      data: customers,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getCustomerByID = async (req, res, next) => {
  const { customerID } = req.query;

  if (!customerID) {
    errorHandling(`400|Please provide customer ID.|`);
  }

  const isValidObjectId = mongoose.Types.ObjectId.isValid(customerID);

  if (!isValidObjectId) {
    errorHandling(`400|Invalid Customer ID.|`);
  }

  const specificCustomer = await Customer.findById(customerID);

  if (!specificCustomer) {
    errorHandling(`404|Customer not found.|`);
  } else {
    return res.status(200).json({
      statusCode: 200,
      data: specificCustomer,
      message: 'Customer found.',
    });
  }
};

exports.addCustomer = async (req, res, next) => {
  try {
    const { email, fullName, address, phoneNumber } = req.body;

    if (!email) {
      errorHandling(`400|Please provide email.|`);
    }
    if (!fullName) {
      errorHandling(`400|Please provide full name.|`);
    }

    if (!phoneNumber) {
      errorHandling(`400|Please provide phone number.|`);
    }

    const existingCustomer = await Customer.findOne({ email: email });

    if (existingCustomer) {
      errorHandling(`401|Customer with email, ${email} already exists.|`);
    } else {
      const newCustomer = new Customer({
        email: email,
        fullName: fullName,
        address,
        phoneNumber,
        status: 'active',
      });

      await newCustomer.save();

      const createdCustomer = await Customer.findOne({
        email: email,
      }).select(`-password`);

      return res.status(200).json({
        statusCode: 200,
        message: `Customer, ${fullName} created`,
        data: createdCustomer,
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { ownerEmail } = req.query;

    const { email, fullName, address, phoneNumber } = req.body;

    if (!ownerEmail) {
      errorHandling(`400|Please provide admin or owner email.|`);
    }

    if (!email) {
      errorHandling(`400|No email detected.|`);
    }

    const existingAdmin = await Admin.findOne({ email: ownerEmail });
    const existingOwner = await Owner.findOne({ email: ownerEmail });
    const existingCustomer = await Customer.findOne({ email: email });

    if (!existingAdmin && !existingOwner) {
      errorHandling(`409|Not authorized.|`);
    }
    if (!existingCustomer) {
      errorHandling(`404|Customer not found.|`);
    } else {
      await Customer.findOneAndUpdate(
        { email: email },
        {
          email,
          address,
          phoneNumber,
          fullName,
        },
      );
      const updatedCustomer = await Customer.findOne({ email: email });

      return res.status(200).json({
        statusCode: 200,
        message: 'Customer updated successfully.',
        data: updatedCustomer,
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { ownerEmail, email } = req.query;

    if (!ownerEmail) {
      errorHandling(`400|Please provide owner email.|`);
    }

    if (!email) {
      errorHandling(`400|No email detected.|`);
    }

    const existingOwner = await Owner.findOne({ email: ownerEmail });
    const existingCustomer = await Customer.findOne({ email: email });

    if (!existingOwner) {
      errorHandling(`404|Owner not found.|`);
    }
    if (!existingCustomer) {
      errorHandling(`404|Customer not found.|`);
    } else {
      await Customer.deleteOne({ email });

      return res.status(200).json({
        statusCode: 200,
        message: 'Customer deleted successfully',
      });
    }
  } catch (e) {
    next(new Error(e.stack));
  }
};

