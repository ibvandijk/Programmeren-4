const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// UC-101 Login
router.put('/api/login', userController.loginUser);

// UC-201 Registreren als nieuwe user
router.post('/api/user', userController.createUser);

// UC-202 Opvragen van overzicht van users
router.get('/api/user', userController.getUserList);

// UC-203 Opvragen van gebruikersprofiel
router.get('/api/user/profile', userController.getUserProfile);

// UC-204 Opvragen van usergegevens bij ID
router.get('/api/user/:userId', userController.getUserProfileById)

// UC-205 Wijzigen van usergegevens


// UC-206 Verwijderen van user
router.delete('/api/user/:userId', userController.deleteUser);

module.exports = router;
