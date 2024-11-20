const express = require('express');
const session = require("express-session")
const bodyParser = require('body-parser')
const db = require('./config/database');
const APIError = require('./helpers/APIError');
const httpStatus = require('http-status');
const expressValidation = require('express-validation');
const path = require("path")
const multiparty = require("connect-multiparty");
const fs = require('fs');
const cors = require('cors');

const logger = require('morgan');

const port = process.env.PORT || 5001

const app = express();
app.use(bodyParser.urlencoded({ limit: '15gb', extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: "S$DV^^",
    resave: true,
    saveUninitialized: true
}));

db.connection().then((database) => {

    module.exports = database

    app.use('/api/user', require('./routes/user.routes'));
    app.use('/api/auth', require('./routes/auth.routes'));
    app.use('/api/meal', require('./routes/meal.routes'));

    app.use((err, req, res, next) => {
        if (err instanceof expressValidation.ValidationError) {
            // validation error contains errors which is an array of error each containing message[]
            const unifiedErrorMessage = err.errors.map(Error => Error.messages.join('. ')).join(' and ');
            const error = new APIError(unifiedErrorMessage, err.status, true);
            return next(error);
        } else if (!(err instanceof APIError)) {
            const apiError = new APIError(err.message, err.status, err.name === 'UnauthorizedError' ? true : err.isPublic);
            return next(apiError);
        }
        return next(err);
    });

    app.use((req, res, next) => {
        const err = new APIError('API Not Found', httpStatus.NOT_FOUND, true);
        return next(err);
    });

    app.use((err, req, res, next) => {
        res.status(err.status).json({
            error: err.isPublic ? err.message : httpStatus[err.status],
        });
    }
    );
    app.listen(port, () => {
        console.log(`The Fitness App is up on port ${port}`);
    })
});
