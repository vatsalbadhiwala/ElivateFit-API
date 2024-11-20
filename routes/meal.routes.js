const express = require('express');
const router = express.Router();
const mealsController = require('../controllers/meal.controllers');
const { protect } = require('../middleware/auth');

console.log(mealsController)
// Route to add a new meal for a user
router.post('/log-meal/:userId', protect, mealsController.addMeal);

// Route to get meals by date for a specific user
router.get('/get-meals/:userId', protect, mealsController.getMealsByDate);

// Route to update or delete a meal item by mealId
router.put('/update-meal/:mealId', protect, mealsController.updateMeal);

// Route to get meals by userId for a specific user
router.get('/get-all-meals/:userId', protect, mealsController.getAllMealByUser);

module.exports = router;