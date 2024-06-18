'use strict';
const express = require('express');
const {
  addOwner,
  getAllOwners,
  deleteOwner,
  requestOwnerPasswordReset,
  resendOwnerOTP,
  resetOwnerPassword,
  ownerLogin,
} = require('../controllers/owner/ownerController');
const {
  addAdmin,
  deleteAdmin,
  getAllAdmins,
  adminLogin,
  requestAdminPasswordReset,
  resendAdminOTP,
  resetAdminPassword,
} = require('../controllers/admin/adminController');
const {
  getAllCustomers,
  addCustomer,
  deleteCustomer,
  updateCustomer,
  getCustomersLength,
  getAllCustomersByEmail,
  getCustomerByID,
} = require('../controllers/customer/customerController');
const {
  getAllPickups,
  addPickup,
  markPickupAsComplete,
  deletePickup,
  getPickupsLength,
  getPickupByID,
} = require('../controllers/pickup/pickupController');
const {
  getAllNotifications,
  markNotificationAsRead,
  deleteNotification,
} = require('../controllers/notification/notificationController');
const {
  getAllMessages,
  addMessage,
  deleteMessage,
  sendBroadcastMessage,
  getMessagesLength,
  getMessageByID,
} = require('../controllers/message/messageController');
const router = express.Router();

// Sample Code
// router.post('/wallet/sendToWallet', sendToWallet);

// Protected Route
// router.post('/auth/addUserLike', verifyToken, addUserLike);

// Authentication

// Owner
router.get('/auth/getAllOwners', getAllOwners);
router.post('/auth/createOwner', addOwner);
router.post('/auth/loginOwner', ownerLogin);
router.delete('/auth/deleteOwner', deleteOwner);
router.post('/auth/requestOwnerPasswordReset', requestOwnerPasswordReset);
router.post('/auth/resendOwnerOTP', resendOwnerOTP);
router.post('/auth/resetOwnerPassword', resetOwnerPassword);

// Admin
router.get('/auth/getAllAdmins', getAllAdmins);
router.post('/auth/createAdmin', addAdmin);
router.post('/auth/loginAdmin', adminLogin);
router.delete('/auth/deleteAdmin', deleteAdmin);
router.post('/auth/requestAdminPasswordReset', requestAdminPasswordReset);
router.post('/auth/resendAdminOTP', resendAdminOTP);
router.post('/auth/resetAdminPassword', resetAdminPassword);

// Customer
router.get('/auth/getAllCustomers', getAllCustomers);
router.get('/auth/getCustomersLength', getCustomersLength);
router.get('/auth/getAllCustomersByEmail', getAllCustomersByEmail);
router.get('/auth/getCustomerByID', getCustomerByID);
router.post('/auth/createCustomer', addCustomer);
router.patch('/auth/editCustomer', updateCustomer);
router.delete('/auth/deleteCustomer', deleteCustomer);

// Pickup
router.get('/pickup/getAllPickups', getAllPickups);
router.get('/pickup/getPickupsLength', getPickupsLength);
router.get('/pickup/getPickupByID', getPickupByID);
router.post('/pickup/createPickup', addPickup);
router.patch('/pickup/markAsComplete', markPickupAsComplete);
router.delete('/pickup/deletePickup', deletePickup);

// Notification
router.get('/notification/getAllNotifications', getAllNotifications);
router.post('/notification/markNotificationAsRead/:id', markNotificationAsRead);
router.delete('/notification/deleteNotification/:id', deleteNotification);

// Messages
router.get('/message/getAllMessages', getAllMessages);
router.get('/message/getMessageByID', getMessageByID);
router.get('/message/getMessagesLength', getMessagesLength);
router.post('/message/createMessage', addMessage);
router.post('/message/sendBroadcastMessage', sendBroadcastMessage);
router.delete('/message/deleteMessage/:messageID', deleteMessage);

module.exports = router;

