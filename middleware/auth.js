const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const db = require('../index')
const query = require('../query/query');
const userColl = db.collection('Users')
const { ObjectID } = require('mongodb');

dotenv.config();

// verify JWT token and protect routes.
const protect = async (req, res, next) => {
    let token;
    let message = 'Not authorized to access this route.';
    let msg = 'The user belonging to this token does not exist.';
    // check header for authorization
    if (req.headers.authorization) {
        if (req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else {
            token = req.headers.authorization;
        }
    }

    // check token
    if (!token) {
        return next(new APIError(message, httpStatus.UNAUTHORIZED, true));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const decodeId = { _id: ObjectID(decoded._id) }
        const user = await query.findOne(userColl, decodeId);

        if (user) {
            req.user = user;
            next();
        } else {
            return next(new APIError(msg, httpStatus.UNAUTHORIZED, true));
        }
    } catch (e) {
        return next(new APIError(message, httpStatus.UNAUTHORIZED, true));
    }
}


module.exports = {
    protect,
}