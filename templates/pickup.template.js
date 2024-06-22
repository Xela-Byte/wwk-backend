const pickupEmailTemplate = (fullName, orderNumber) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Pickup Order</title>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        .header {
            background-color: #FDE198;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
        }
        .footer {
            background-color: #FDE198;
            padding: 10px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Pickup Order</h1>
    </div>
    <div class="content">
        <p>Dear, <strong>${fullName}</strong></p>
        <p>Your Pickup Order Number is: <strong>${orderNumber}</strong></p>
        <p>If you did not request this order, please ignore this email or reach out to us with this order number.</p>
        <p>Best regards,</p>
        <p>Wash With Kings Team.</p>
    </div>
    <div class="footer">
        <p>Wash With Kings</p>
    </div>
</body>
</html>`;

  return html;
};

module.exports = {
  pickupEmailTemplate,
};

