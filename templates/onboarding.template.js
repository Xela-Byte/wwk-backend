const welcomeEmailTemplate = () => {
  const html = `
  <!DOCTYPE html>
<html>
<head>
    <title>Welcome to Wash With Kings</title>
    <style>
        body {
            font-family: Nunito, sans-serif;
        }
        .header {
            background-color: #E1510F;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
        }
        .footer {
            background-color: #E1510F;
            padding: 10px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Wash With Kings!</h1>
    </div>
    <div class="content">
        <p>We are thrilled to have you on board.</p>
        <p>At Wash With Kings, we strive to provide the best service possible. We hope you enjoy your experience with us.</p>
        <p>If you have any questions or need assistance, feel free to reach out to us.</p>
        <p>Best regards,</p>
        <p>Wash With Kings Team.</p>
    </div>
</body>
</html>
  `;

  return html;
};

module.exports = {
  welcomeEmailTemplate,
};

