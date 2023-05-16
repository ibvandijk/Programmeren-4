const database = require('../util/inmem-db');
const logger = require('../util/utils').logger;
const assert = require('assert');
const pool = require('../util/mysql-db');
const jwt = require('jsonwebtoken');

const userController = {

  // UC-201 Registreren als nieuwe user
  createUser: (req, res) => {
		let user = req.body;
		// Establish a database connection
    dbconnection.getConnection(function (err, connection) {
	    if (err) throw err;
      // Insert user data into the 'user' table
      connection.query(
        'INSERT INTO user (firstName, lastName, street, city, phoneNumber, emailAdress, password) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [user.firstName, user.lastName, user.street, user.city, user.phoneNumber, user.emailAdress, user.password, ],
        function (err, result, fields) {
          if (err) {
            // If there is an error, release the connection and send a 409 status with an error message
            connection.release();
            res.status(409).json({
              status: 409,
              message: `The email address: ${user.emailAdress} has already been taken!`,
            });
          } else {
            // If the user is successfully inserted, retrieve the inserted user from the database
            connection.query(
              'SELECT * FROM user WHERE emailAdress = ?',
              [user.emailAdress],
              function (error, results, fields) {
                connection.release();
                user = results[0];
                // Set isActive property to true if it's true, otherwise set it to false (ensures that user.isActive is always a boolean value)
                user.isActive = (user.isActive) ? true : false;
                // Send a 201 status with the inserted user as a response
                res.status(201).json({
                  status: 201,
                  result: user,
                });
              }
            );
          }
          // End of the database connection callback
        }
      );
    });
	},


  // UC-202 Opvragen van overzicht van users
  getAllUsers: (req, res, next) => {
    logger.info('Get all users');

    let sqlStatement = 'SELECT * FROM `user`';

    pool.getConnection(function (err, conn) {
      // Do something with the connection
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code
        });
      }
      if (conn) {
        conn.query(sqlStatement, [req.userId], (err, results, fields) => {
          if (err) {
            logger.error(err.message);
            next({
              code: 409,
              message: err.message
            });
          }
          if (results) {
            logger.trace('Found', results.length, 'results');
            res.status(200).json({
              code: 200,
              message: 'show all users',
              data: results
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  // UC-203 Opvragen van gebruikersprofiel
  getUserProfile: (req, res, next) => {
    req.userId = 1;
    logger.trace('Get user profile for user', req.userId);

    let sqlStatement = 'SELECT * FROM `user` WHERE id=?';

    pool.getConnection(function (err, conn) {
      // Do something with the connection
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code
        });
      }
      if (conn) {
        conn.query(sqlStatement, [req.userId], (err, results, fields) => {
          if (err) {
            logger.error(err.message);
            next({
              code: 409,
              message: err.message
            });
          }
          if (results) {
            logger.trace('Found', results.length, 'results');
            res.status(200).json({
              code: 200,
              message: 'Get User profile',
              data: results[0]
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  getUserProfileById: (req, res) => {
    logger.trace('Show user with user id', req.params.userId);

    let sqlStatement = 'SELECT * FROM `user` WHERE id=?';

    pool.getConnection(function (err, conn) {
      // Do something with the connection
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code
        });
      }
      if (conn) {
        conn.query(sqlStatement, [req.params.userId], (err, results, fields) => {
          if (err) {
            logger.error(err.message);
            next({
              code: 409,
              message: err.message
            });
          }
          if (results) {
            logger.trace('Found', results.length, 'results');
            res.status(200).json({
              code: 200,
              message: 'Get User profile',
              data: results[0]
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },
  
  // UC-206 Verwijderen van user
  deleteUser: (req, res) => {
    logger.trace('Delete user profile', req.params.userId);

    let sqlStatement = 'DELETE FROM `user` WHERE id=?';

    pool.getConnection(function (err, conn) {
      // Do something with the connection
      if (err) {
        logger.error(err.code, err.syscall, err.address, err.port);
        next({
          code: 500,
          message: err.code
        });
      }
      if (conn) {
        conn.query(sqlStatement, [req.params.userId], (err, results, fields) => {
          if (err) {
            logger.error(err.message);
            next({
              code: 409,
              message: err.message
            });
          }
          if (results) {
            logger.trace('Found', results.length, 'results');
            res.status(200).json({
              code: 200,
              message: 'deleted user',
              data: results
            });
          }
          else {
            logger.warn('no user found')
            res.status(400).json({
              code: 400,
              message: 'No user found',
              data: results
            });
          }
        });
        pool.releaseConnection(conn);
      }
    });
  },

  updateUser: (req, res) => {
    // Update user from userId
    logger.info('Update user')

    // userId is passed trough the url
    const userId = parseInt(req.params.userId);
    logger.debug('userId = ', userId);
  }

  
}

module.exports = userController;
