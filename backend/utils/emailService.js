const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter using Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  // Define the email options
  const mailOptions = {
    from: `"DentaAI System" <${process.env.GMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send the email
  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
