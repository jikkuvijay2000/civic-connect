const nodemailer = require('nodemailer');

// For development, we'll use Ethereal or just log to console if no credentials
const sendEmail = async (options) => {
    // 1. Create a transporter
    // Replace with your SMTP credentials for production
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or your service
        auth: {
            user: process.env.EMAIL_USER, // Set these in .env
            pass: process.env.EMAIL_PASS
        }
    });

    // Fallback for development if no env vars
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log("---------------------------------------------------");
        console.log("EMAIL SERVICE (MOCK): No credentials provided.");
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log("---------------------------------------------------");
        return;
    }

    // 2. Define email options
    const mailOptions = {
        from: 'Civic Sense Support <support@civicsense.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html // You can add HTML templates later
    };

    // 3. Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
