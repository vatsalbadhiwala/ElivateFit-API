const APIError = require('../helpers/APIError');
const resPattern = require('../helpers/resPattern');
const httpStatus = require('http-status');
const db = require('../index')
const query = require('../query/query')
const { generatePassword, generateOTP, sendEmail, generateRandomPassword, validPassword, emailTemplate } = require('../helpers/commonfile');

const otpColl = db.collection('OTP');

const userColl = db.collection('Users');


const forgotPassword = async (req, res, next) => {
    try {
        const reqData = { email: req.body.email }

        let userData = await query.findOne(userColl, reqData);

        if (!userData || userData.password == null) {
            const message = `Incorrect email or password.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }

        const generatedPass = generateRandomPassword();
        const encryptPass = generatePassword(generatedPass);

        let updateUserData = await query.findOneAndUpdate(userColl, reqData, { $set: { password: encryptPass } });

        const emailSubject = 'Fitness App: Reseted password'
        const emailBody = emailTemplate(generatedPass, req.body.email)

        await sendEmail(req.body.email, emailSubject, emailBody);

        let obj = resPattern.successPattern(httpStatus.OK, updateUserData.ops, 'success');
        return res.status(obj.code).json(obj)

    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

const resetPassword = async (req, res, next) => {
    try {
        const reqData = req.body

        let userData = await query.findOne(userColl, { email: reqData.email });

        if (!userData || userData.password == null) {
            const message = `Incorrect email or password.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }

        const isValidate = validPassword(userData.password, reqData.code)

        if (isValidate) {
            const encryptPass = generatePassword(reqData.newPassword);

            let updateUserData = await query.findOneAndUpdate(userColl, { email: reqData.email }, { $set: { password: encryptPass } });
            let obj = resPattern.successPattern(httpStatus.OK, updateUserData.ops, 'success');
            return res.status(obj.code).json(obj)
        } else {
            let obj = resPattern.errorPattern(httpStatus.BAD_REQUEST, 'The Code is no longer valid');
            return res.status(obj.code).json(obj)
        }

    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

const generateAndSendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await query.findOne(userColl, { email });
        if (!user) {
            return next(new APIError('User not found', httpStatus.NOT_FOUND, true));
        }

        // Generate OTP
        const otp = generateOTP();
        const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        // Store OTP in MongoDB
        await query.findOneAndUpdate(
            otpColl,
            { email },
            {
                $set: {
                    otp,
                    expirationTime,
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        // Prepare email
        const emailSubject = 'Fitness App: Your OTP for Password Reset';
        const emailBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4CAF50;">OTP for Password Reset</h2>
                <p>Hello,</p>
                <p>You have requested to reset your password. Here is your One-Time Password (OTP):</p>
                <p style="font-size: 1.2em; font-weight: bold; color: #d9534f;">${otp}</p>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Thanks,<br>The Fitness App Team</p>
            </div>
        `;

        // Send email
        await sendEmail(email, emailSubject, emailBody);

        let obj = resPattern.successPattern(httpStatus.OK, { message: 'OTP sent successfully' }, 'success');
        return res.status(obj.code).json(obj);

    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
};

const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const otpDoc = await query.findOne(otpColl, { email });

        if (!otpDoc) {
            return next(new APIError('OTP not found', httpStatus.NOT_FOUND, true));
        }

        if (otpDoc.otp !== otp) {
            return next(new APIError('Invalid OTP', httpStatus.BAD_REQUEST, true));
        }

        if (new Date() > otpDoc.expirationTime) {
            return next(new APIError('OTP has expired', httpStatus.BAD_REQUEST, true));
        }

        // OTP is valid, you can proceed with password reset or other actions here

        // Remove the used OTP
        await query.deleteOne(otpColl, { email });

        let obj = resPattern.successPattern(httpStatus.OK, { message: 'OTP verified successfully' }, 'success');
        return res.status(obj.code).json(obj);

    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
};


const adminResetPassword = async (req, res, next) => {
    try {
        const reqData = req.body

        let userData = await query.findOne(userColl, { email: reqData.oldEmail });

        if (!userData || userData.password == null) {
            const message = `Incorrect email or password.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }

        const generatedPass = generateRandomPassword();
        const encryptPass = generatePassword(generatedPass);

        let updateUserData = await query.findOneAndUpdate(userColl, { email: reqData.oldEmail }, { $set: { password: encryptPass } });

        const emailSubject = 'Fitness App: Reseted password'
        const emailBody =  emailTemplate(generatedPass, req.body.oldEmail)

        await sendEmail(reqData.newEmail, emailSubject, emailBody);

        let obj = resPattern.successPattern(httpStatus.OK, updateUserData.ops, 'success');
        return res.status(obj.code).json(obj)

    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

module.exports = {
    forgotPassword,
    resetPassword,
    generateAndSendOTP,
    verifyOTP,
    adminResetPassword
}
