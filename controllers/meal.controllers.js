// meals.controller.js
const APIError = require('../helpers/APIError');
const resPattern = require('../helpers/resPattern');
const httpStatus = require('http-status');
const db = require('../index');
const { ObjectId } = require('mongodb');



const mealsColl = db.collection('Meals');

// Add a new meal for a specific user
const addMeal = async (req, res, next) => {
    try {
        const userId = req.params.userId; // User ID is passed in request parameters
        const mealData = req.body;

        mealData.userId = ObjectId(userId); // Add userId to meal data
        mealData.date = req.query.date; // Assign querie'd date to meal

        const insertResponse = await mealsColl.insertOne(mealData);
        let obj = resPattern.successPattern(httpStatus.OK, insertResponse.ops[0], 'Meal added successfully');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
};

// Fetch meals by date for a specific user
const getMealsByDate = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const date = req.query.date;

        const meals = await mealsColl.find({ userId: ObjectId(userId), date: date }).toArray();
        let obj = resPattern.successPattern(httpStatus.OK, meals, 'Meals fetched successfully');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
};

// Update meal item or remove if quantity is zero
const updateMeal = async (req, res, next) => {
    try {
        const mealId = req.params.mealId;
        const { quantity, nutrients } = req.body;

        if (quantity === 0) {
            const deleteResponse = await mealsColl.deleteOne({ _id: ObjectId(mealId) });
            if (deleteResponse.deletedCount === 0) {
                return next(new APIError('Meal not found or could not be deleted', httpStatus.BAD_REQUEST, true));
            }
            return res.status(200).json({
                code: 200,
                message: 'Meal removed successfully'
            });
        } else {
            const updateResponse = await mealsColl.updateOne(
                { _id: ObjectId(mealId) },
                { $set: { quantity: quantity, nutrients: nutrients } }
            );
            if (updateResponse.modifiedCount === 0) {
                return next(new APIError('Meal could not be updated', httpStatus.BAD_REQUEST, true));
            }
            return res.status(200).json({
                code: 200,
                message: 'Meal updated successfully'
            });
        }
    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
};

const getAllMealByUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;

        const meals = await mealsColl.find({ userId: ObjectId(userId) }).toArray();

        let obj = resPattern.successPattern(httpStatus.OK, meals, 'Meals fetched successfully');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

module.exports = {
    addMeal,
    getMealsByDate,
    updateMeal,
    getAllMealByUser
};