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
