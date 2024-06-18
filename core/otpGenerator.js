const generateOTP = () => {
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
};

const generateOrderNumber = () => {
  let orderNumber = '';
  for (let i = 0; i < 15; i++) {
    orderNumber += Math.floor(Math.random() * 10).toString();
  }
  return `ORD-${orderNumber}`;
};

module.exports = {
  generateOTP,
  generateOrderNumber,
};

