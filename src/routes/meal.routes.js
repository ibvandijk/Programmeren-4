const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const authController = require('../controllers/auth.controller');

// UC-301 Toevoegen van maaltijd
router.post(
	'/api/meal',
	authController.validateToken,
	mealController.validateMeal,
	mealController.registerMeal
);

// UC-302 Wijzigen van maaltijd
router.put(
	'/api/meal/:mealId',
	authController.validateToken,
	mealController.updateMealById
);

// UC-303 Opvragen van alle maaltijden
router.get(
    '/api/meal',
    mealController.getAllMeals
);

// UC-304 Opvragen van maaltijd bij ID
router.get(
    '/api/meal/:mealId', 
    mealController.getMealById
);

// UC-305 Verwijderen van maaltijd
router.delete(
	'/api/meal/:mealId',
	authController.validateToken,
	mealController.deleteMealById
);

module.exports = router;
