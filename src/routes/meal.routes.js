const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const authController = require('../controllers/auth.controller');

// UC-301
router.post(
	'/api/meal',
	authController.validateToken,
	mealController.validateMeal,
	mealController.registerMeal
);

// UC-302
router.get(
    '/api/meal',
    mealController.getAllMeals
);

// UC-303
router.get(
    '/api/meal/:mealId', 
    mealController.getMealById
);

// UC-304
router.put(
	'/api/meal/:mealId',
	authController.validateToken,
	mealController.updateMealById
);

// UC-305
router.delete(
	'/api/meal/:mealId',
	authController.validateToken,
	mealController.deleteMealById
);

//UC-401
router.get(
	'/api/meal/:mealId/participate',
	authController.validateToken,
);

module.exports = router;
