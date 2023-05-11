const database = require('../util/inmem-db');
const logger = require('../util/utils').logger;
const assert = require('assert');
const pool = require('../util/mysql-db');
const jwt = require('jsonwebtoken');

const userController = {

  // UC-201 Registreren als nieuwe user
  createUser: (req, res) => {

    logger.info('Register user');
    const user = req.body;
    logger.debug('user = ', user);

    try {
      assert(typeof user.firstName === 'string', 'firstName must be a string');
      assert(typeof user.emailAdress === 'string', 'emailAddress must be a string');
    } catch (err) {
      logger.warn(err.message.toString());
      // if one of the asserts fail, send error response
      res.status(400).json({
        status: 400,
        message: err.message.toString(),
        data: {}
      });
      return;
    }

    // assign user id, and increment for next insert
    user.id = database.index++;

    // add user to db
    database['users'].push(user);
    logger.info('New user added to database');

    // send succesfull response
    res.status(200).json({
      status: 200,
      message: `User met id ${user.id} is toegevoegd`,
      data: user
    });
  },


  // UC-202 Opvragen van overzicht van users
  getAllUsers: (req, res, next) => {
    logger.info('Get all users');
    // er moet precies 1 response verstuurd worden.
    const statusCode = 200;
    res.status(statusCode).json({
      status: statusCode,
      message: 'User getAll endpoint',
      data: database.users
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
    
    const userId = parseInt(req.params.id); // Parse the ID from the URL params

    // Find the user with the given ID in the userList
    const user = userList.find(user => user.id === userId);

  // If user is not found, return 404 Not Found
  if (!user) {
  return res.status(404).json({ message: 'User not found' });
  }

  // Return the user data as JSON
  res.json(user);
  },
  
  // UC-206 Verwijderen van user
  deleteUser: (req, res) => {
    // Delete user from userId
    logger.info('Delete user');

    // the userId is passed in the url
    const userId = parseInt(req.params.userId);
    logger.debug('userId = ', userId);

    //delete entry 
    try {
      for (let index = 0; index < database['users'].length; index++) {
        if (database['users'][index].id === userId) {
          delete database['users'][index];
          res.status(200).json({
            status: 200,
            message: `User met id ${userId} is verwijdert`,
            data: {}
          });
        }
      }
      assert('userId not found');
    } catch (err) {
      logger.warn(err.message.toString());
      res.status(400).json({
        status: 400,
        message: err.message.toString(),
        data: {}
      });
    }
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
