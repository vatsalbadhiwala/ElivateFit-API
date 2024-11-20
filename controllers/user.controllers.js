const APIError = require('../helpers/APIError');
const resPattern = require('../helpers/resPattern');
const httpStatus = require('http-status');
const db = require('../index')
const query = require('../query/query')
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { generatePassword, validPassword } = require('../helpers/commonfile');


const userColl = db.collection('Users');

const registerUsers = async (req, res, next) => {
    try {

        let userData = req.body

        let getUser = await query.findOne(userColl, { email: userData.email })
        if (getUser) {
            return next(new APIError(`User already exists, Plese try another email!!`, httpStatus.BAD_REQUEST, true))
        }

        userData.password = generatePassword(req.body.password)

        if (!userData.userType) {
            userData.userType = 'user'
        }

        let registerUsers = await query.insert(userColl, userData)

        let obj = resPattern.successPattern(httpStatus.OK, registerUsers.ops, 'success');
        return res.status(obj.code).json(obj)

    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}


const userLogin = async (req, res, next) => {
    try {
        const { password } = req.body;
        const reqData = { email: req.body.email }

        let userData = await query.findOne(userColl, reqData);

        if (!userData || userData.password == null) {
            const message = `Incorrect email or password.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }
        const isMatch = validPassword(userData.password, password)

        if (isMatch) {
            const token = jwt.sign({ _id: userData._id, email: userData.email, userType: userData.userType }, process.env.JWT_SECRET)
            delete userData.password
            let obj = resPattern.successPattern(httpStatus.OK, { userData, token }, 'success');
            return res.status(obj.code).json(obj)
        } else {
            const message = `Incorrect email or password.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }

    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

const getUser = async (req, res, next) => {
    try {
        let getUser = await query.find(userColl, { userType: 'user'});

        let obj = resPattern.successPattern(httpStatus.OK, getUser, 'success');
        return res.status(obj.code).json(obj)
    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

const getUserById = async (req, res, next) => {
    try {
        const userId = req.params.Id;

        const getUserById = await query.findOne(userColl, { _id: ObjectId(userId) });
        let obj = resPattern.successPattern(httpStatus.OK, getUserById, 'success');
        return res.status(obj.code).json(obj)
    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

const updateUserById = async (req, res, next) => {
    try {

        const userId = req.params.Id
        const reqData = req.body

        const updatedObj = {
            firstName: reqData.firstName,
            lastName: reqData.lastName,
            sex: reqData.sex,
            height: reqData.height,
            heightUnit: reqData.heightUnit,
            weight: reqData.weight,
            weightUnit: reqData.weightUnit
        }
        let updateUserData = await query.findOneAndUpdate(userColl, { _id: ObjectId(userId) }, { $set: updatedObj });
        let obj = resPattern.successPattern(httpStatus.OK, updateUserData.ops, 'success');
        return res.status(obj.code).json(obj)

    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

const updateUserEmailFromAdmin = async(req, res, next) => {
    try{
        const userId = req.params.Id
        const reqData = {email: req.body.email}

        let updateUserData = await query.findOneAndUpdate(userColl, { _id: ObjectId(userId) }, { $set: reqData });
        let obj = resPattern.successPattern(httpStatus.OK, updateUserData.ops, 'success');
        return res.status(obj.code).json(obj)
    }catch(e){
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

const deleteUserById = async(req, res, next) => {
    try{
        const userId = req.params.Id

        let updateUserData = await query.deleteOne(userColl, { _id: ObjectId(userId) });
        let obj = resPattern.successPattern(httpStatus.OK, updateUserData.ops, 'success');
        return res.status(obj.code).json(obj)
    }catch(e){
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

const addMeal = async (req, res, next) => {
    console.log("Received meal data:", req.body);
    console.log(req.params);

    try {
        const userId = req.params.Id;  
        const mealData = req.body;     

        // current date in YYYY-MM-DD format
        const date = new Date().toISOString().split('T')[0]; 
        mealData.date = date; 

        // Check if a similar meal exists for the same date, section, and label
        const existingMeal = await userColl.findOne(
            { _id: ObjectId(userId), "meals.date": date, "meals.section": mealData.section, "meals.label": mealData.label },
            { projection: { "meals.$": 1 } } 
        );

        if (existingMeal && existingMeal.meals && existingMeal.meals.length > 0) {
            const existingMealData = existingMeal.meals[0];

            // Update quantity and nutrients
            const newQuantity = existingMealData.quantity + mealData.quantity;
            const updatedNutrients = {
                protein: existingMealData.nutrients.protein + mealData.nutrients.protein,
                fat: existingMealData.nutrients.fat + mealData.nutrients.fat,
                carbohydrates: existingMealData.nutrients.carbohydrates + mealData.nutrients.carbohydrates
            };

            const updateResponse = await userColl.updateOne(
                { _id: ObjectId(userId), "meals._id": existingMealData._id },
                { $set: { "meals.$.quantity": newQuantity, "meals.$.nutrients": updatedNutrients } }
            );

            if (updateResponse.matchedCount === 0) {
                return next(new APIError('Meal update failed', httpStatus.NOT_FOUND, true));
            }

            return res.status(200).json({
                code: 200,
                message: 'Meal updated successfully',
                data: updateResponse
            });

        } else {
            // If no similar meal exists, add the new meal with a unique _id
            mealData._id = new ObjectId();

            const updateResponse = await userColl.updateOne(
                { _id: ObjectId(userId) },
                { $push: { meals: mealData } }
            );

            if (updateResponse.matchedCount === 0) {
                return next(new APIError('User not found', httpStatus.NOT_FOUND, true));  
            }

            return res.status(200).json({
                code: 200,
                message: 'Meal added successfully',
                data: updateResponse
            });
        }
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
};

const getMealsByDate = async (req, res, next) => {
    try {
        
        const userId = req.params.Id;
        const date = req.query.date 
        console.log(req.query);
        const user = await userColl.findOne(
            { _id: ObjectId(userId) },
            { projection: { meals: { $filter: { input: "$meals", as: "meal", cond: { $eq: ["$$meal.date", date] } } } } }
        );
        if (!user) {
            return next(new APIError('User not found', httpStatus.NOT_FOUND, true));
        }
        const mealsWithId = user.meals.map((meal) => ({
            ...meal,
            mealId: meal._id,  
        }));
        let obj = resPattern.successPattern(httpStatus.OK, mealsWithId, 'Daily meals fetched successfully');
        return res.status(obj.code).json(obj);
    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
};

// Update meal item (acts as a delete as well)
const updateMeal = async (req, res, next) => {
    try {
        const userId = req.params.Id;
        const mealId = req.body.mealId;  
        const newQuantity = req.body.quantity;  
        const newNutrients = req.body.nutrients;  

        const user = await userColl.findOne({ _id: ObjectId(userId) });
        if (!user) {
            return next(new APIError('User not found', httpStatus.NOT_FOUND, true));
        }

        const mealIndex = user.meals.findIndex(meal => meal._id.toString() === mealId);
        if (mealIndex === -1) {
            return next(new APIError('Meal not found', httpStatus.NOT_FOUND, true));
        }

        // If the quantity is 0, remove the meal
        if (newQuantity === 0) {
            const updateResponse = await userColl.updateOne(
                { _id: ObjectId(userId) },
                { $pull: { meals: { _id: ObjectId(mealId) } } }
            );

            if (updateResponse.modifiedCount === 0) {
                return next(new APIError('Meal not found or could not be deleted', httpStatus.BAD_REQUEST, true));
            }

            return res.status(200).json({
                code: 200,
                message: 'Meal removed successfully'
            });
        } else {
            // Update the meal quantity and nutrients
            const updateResponse = await userColl.updateOne(
                { _id: ObjectId(userId), "meals._id": ObjectId(mealId) },
                {
                    $set: {
                        "meals.$.quantity": newQuantity,
                        "meals.$.nutrients": newNutrients
                    }
                }
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
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
};

const getTodayMacros = async (req, res, next) => {
    try {
        const userId = req.params.Id;
        const date = new Date().toISOString().split('T')[0];
        
        const user = await userColl.findOne({ _id: ObjectId(userId) });
        if (!user) return next(new APIError('User not found', httpStatus.NOT_FOUND, true));

        const todayMeals = user.meals.filter(meal => meal.date === date);
        const totalMacros = todayMeals.reduce((totals, meal) => {
            totals.protein += meal.nutrients.protein * meal.quantity;
            totals.fat += meal.nutrients.fat * meal.quantity;
            totals.carbohydrates += meal.nutrients.carbohydrates * meal.quantity;
            return totals;
        }, { protein: 0, fat: 0, carbohydrates: 0 });

        res.status(200).json({
            code: 200,
            message: 'Macro-nutrients for today fetched successfully',
            data: totalMacros,
        });
    } catch (e) {
        return next(new APIError(e.message, httpStatus.BAD_REQUEST, true));
    }
};

const logExercise = async (req, res, next) => {
    try {
        const userId = req.params.Id;
        const { exercise, duration, intensity, weight, unit, calories, date } = req.body;
        
        const exerciseEntry = {
            activity: exercise,
            minutes: duration,  
            intensity: intensity,
            weight: weight, 
            unit: unit, 
            calories: calories,
            date: date
        };

        const result = await userColl.updateOne(
            { _id: ObjectId(userId) },
            { $push: { exerciseLogs: exerciseEntry } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Exercise logged successfully' });
    } catch (error) {
        next(error);
    }
};

const getExerciseLogs = async (req, res, next) => {
    try {
        const userId = req.params.Id;
        const { date } = req.query;

        const user = await userColl.findOne(
            { _id: ObjectId(userId) },
            { projection: { exerciseLogs: 1 } }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const exerciseLogsForDate = user.exerciseLogs?.filter(log => log.date === date).map(log => ({
            activity: log.activity,
            minutes: log.minutes,
            calories: log.calories,
            weight: log.weight,
            unit: log.unit, 
        })) || [];

        console.log(exerciseLogsForDate);

        res.status(200).json({ data: exerciseLogsForDate });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUsers,
    userLogin,
    getUser,
    getUserById, 
    addMeal,
    getMealsByDate,
    updateMeal,
    updateUserById,
    updateUserEmailFromAdmin,
    deleteUserById,
    getTodayMacros,
    logExercise,
    getExerciseLogs
}