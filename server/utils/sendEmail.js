const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Define available email accounts
    const accounts = [
        {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        {
            user: process.env.EMAIL_USER_2,
            pass: process.env.EMAIL_PASS_2
        }
    ];

    // Filter out accounts that might be undefined (in case they are not set in .env)
    const validAccounts = accounts.filter(acc => acc.user && acc.pass);

    if (validAccounts.length === 0) {
        throw new Error('No email accounts configured');
    }

    // Randomly select one account
    const selectedAccount = validAccounts[Math.floor(Math.random() * validAccounts.length)];

    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
        auth: {
            user: selectedAccount.user,
            pass: selectedAccount.pass
        }
    });

    // Define email options
    const mailOptions = {
        from: selectedAccount.user,
        to: options.email,
        subject: options.subject,
        text: options.message
        // html: options.html // You can add HTML support later if needed
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
