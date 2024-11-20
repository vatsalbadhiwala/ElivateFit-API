const bcrypt = require('bcrypt');
const nodeMailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// bcrypt password
const validPassword = (dbPassword, passwordToMatch) => {
    return bcrypt.compareSync(passwordToMatch, dbPassword);
};// validate password

const safeModel = () => {
    return _.omit(this.toObject(), ['password', '__v']);
};

const generatePassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), process.env.PASS_SECRET);
}; //generate encrypted password

// generate Random Password

function generateRandomPassword() {
    var length = 12,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-+=",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}// generate a unique pw.

// generateOTP
function generateOTP() {
    const digits = '123456789';
    let otp = '';
    for (let i = 1; i <= 6; i++) {
        let index = Math.floor(Math.random() * (digits.length));
        otp = otp + digits[index];
    }
    return otp;
}

// send mail
let sendEmail = async (toEmail, subject, bodyHtml, attachments) => {
    const transporter = nodeMailer.createTransport({
        service:'gmail',
        host:'smtp.gmail.com',
        port: 587,
        secure: false,
        debug: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls:{
            rejectUnauthorized: true
        }
    });

    let mailOptions = {
        to: toEmail,
        subject: subject,
        html: `${bodyHtml}`,
        attachments: attachments
    };

    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

const emailTemplate = (generatedPass, email) => {

    const emailBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Here is your new temporary password:</p>
        <p style="font-size: 1.2em; font-weight: bold; color: #d9534f;">${generatedPass}</p>
        
        <p>To complete the process, please click the link below to verify your email and proceed:</p>
        <table cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td align="center" style="padding: 14px 0;">
                    <a href="http://localhost:3000/verify-forgot-password/${email}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: #fff; text-decoration: none; border-radius: 5px; font-family: Arial, sans-serif;">
                        Verify Email
                    </a>
                </td>
            </tr>
        </table>
        
        <p style="margin-top: 20px;">If you didn't request a password reset, you can safely ignore this email.</p>
        
        <p>Thanks, <br> The Fitness App Team</p>
    </div>
`;
return emailBody;
}


module.exports = {
    validPassword,
    safeModel,
    generateRandomPassword,
    generatePassword,
    generateOTP,
    sendEmail,
    emailTemplate
}