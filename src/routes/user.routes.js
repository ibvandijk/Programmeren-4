const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');

// UC-101 Login
router.put(
    '/api/login',
    authController.loginUser,
);

// UC-201 Registreren als nieuwe user
router.post(
    '/api/user',
    userController.validateUser,
    userController.createUser,
);

// UC-202 Opvragen van overzicht van users
router.get(
    '/api/user',
    authController.validateToken,
    userController.getUserList,
);

// UC-203 Opvragen van gebruikersprofiel
router.get(
    '/api/user/profile',
    authController.validateToken,
    userController.getUserProfile,
);

// UC-204 Opvragen van usergegevens bij ID
router.get(
    '/api/user/:userId',
    authController.validateToken,
    userController.getUserProfileById,
);

// UC-205 Wijzigen van usergegevens
router.put(
    '/api/user/:userId',
    authController.validateToken,
    userController.updateUser,
);

// UC-206 Verwijderen van user
router.delete(
    '/api/user/:userId',
    authController.validateToken,
    userController.deleteUser
);

module.exports = router;
