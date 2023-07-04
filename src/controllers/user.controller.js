const database = require('../util/inmem-db');
const logger = require('../util/utils').logger;
const assert = require('assert');
const pool = require('../util/mysql-db');
const jwt = require('jsonwebtoken');
const validate = require('../util/validate');

const jwtSecretKey = require('../config/config.js').jwtSecretKey;

const userController = {
  validateUser: (req, res, next) => {
    logger.info('validateUser called');
    let user = req.body;

    // extract required fields
    let {
        firstName,
        lastName,
        isActive,
        emailAdress,
        password,
        phoneNumber,
        roles,
        street,
        city,
    } = user;

    try {
        // Validate firstName field
        assert(firstName, "Missing field: firstName");
        assert(typeof firstName === "string", "firstName must be a String");

        // Validate lastName field
        assert(lastName, "Missing field: lastName");
        assert(typeof lastName === "string", "lastName must be a String");

        // Validate emailAdress field
        assert(emailAdress, "Missing field: emailAdress");
        assert(typeof emailAdress === "string", "emailAdress must be a String");
        assert(validate.validateEmailAdress(emailAdress), "emailAdress is not valid");

        // Validate password field
        assert(password, "Missing field: password");
        assert(typeof password === "string", "password must be a String");
        assert(validate.validatePassword(password), "password is not valid");

        // Validate phoneNumber field
        assert(phoneNumber, "Missing field: phoneNumber");
        assert(typeof phoneNumber === "string", "phoneNumber must be a String");
        assert(validate.validatePhoneNumber(phoneNumber), "phoneNumber is not valid");

        // Validate street field
        assert(street, "Missing field: street");
        assert(typeof street === "string", "street must be a String");

        // Validate city field
        assert(city, "Missing field: city");
        assert(typeof city === "string", "city must be a String");

        next();
    } catch (err) {
        // If any validation fails, handle the error
        res.status(400).json({
          status: 400,
          message: err.message,
          user
        });
    }
  },



  // UC-201 Registreren als nieuwe user
  createUser: (req, res) => {
    logger.info('createUser called');
		let user = req.body;

		// Establish a database connection
    pool.getConnection(function (err, conn) {
	    if (err) {
        // Handle connection error
        return next({
            status: 500,
            message: 'Failed to get a database connection.'
        });
      }

      // Insert user data into the 'user' table
      conn.query(
        'INSERT INTO user (firstName, lastName, street, city, phoneNumber, emailAdress, password) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [user.firstName, user.lastName, user.street, user.city, user.phoneNumber, user.emailAdress, user.password, ],
        function (err, result, fields) {
          if (err) {
            // If there is an error, release the connection and send a 409 status with an error message
            conn.release();
            res.status(403).json({
              status: 403,
              message: `The email address: ${user.emailAdress} has already been taken!`,
            });
          } else {
            // If the user is successfully inserted, retrieve the inserted user from the database
            conn.query(
              'SELECT * FROM user WHERE emailAdress = ?',
              [user.emailAdress],
              function (error, results, fields) {
                conn.release();
                user = results[0];

                // Set isActive property to true if it's true, otherwise set it to false (ensures that user.isActive is always a boolean value)
                user.isActive = (user.isActive) ? true : false;

                // Send a 201 status with the inserted user as a response
                res.status(201).json({
                  status: 201,
                  message: `User successfully registered`,
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
  getUserList: (req, res) => {
    logger.info('getUserList called');
    const queryParams = req.query;
  
    let dbQuery = 'SELECT * FROM user';
  
    const validFields = ['firstName', 'lastName', 'street', 'city', 'phoneNumber', 'emailAddress', 'password', 'isActive'];
    const queryConditions = [];
  
    // Build the query conditions based on the provided query parameters
    for (const [field, value] of Object.entries(queryParams)) {
      if (validFields.includes(field)) {
        if (Array.isArray(value)) {
          // Handle multiple values for a single field
          const fieldConditions = value.map(val => `${field} LIKE '%${val}%'`);
          queryConditions.push(`(${fieldConditions.join(' OR ')})`);
        } else {
          // Handle single value for a field
          queryConditions.push(`${field} LIKE '%${value}%'`);
        }
      }
    }
  
    // Add the WHERE clause to the query if there are any conditions
    if (queryConditions.length > 0) {
      dbQuery += ' WHERE ' + queryConditions.join(' AND ');
    }
  
    pool.getConnection(function (err, connection) {
      if (err) {
        // Handle connection error
        return next({
            status: 500,
            message: 'Failed to get a database connection.'
        });
      }

      connection.query(dbQuery, function (error, results, fields) {
        connection.release();
        if (error){
          // Handle query execution error
          return next({
            status: 409,
            message: 'internal server error'
          });
        }
  
        // Convert isActive property to boolean
        const userList = results.map(user => {
          return {
            ...user,
            isActive: !!user.isActive,
          };
        });
  
        res.status(200).json({
          status: 200,
          message: 'Users retrieved successfully',
          data: userList,
        });
      });
    });
  },

  // UC-203 Opvragen van gebruikersprofiel
  getUserProfile: (req, res, next) => {
    logger.info('getUserProfile called');
    const token = req.headers.authorization.split(' ')[1]; // the token is sent in the request headers as "Authorization"

    // Verify and decode the JWT token
    jwt.verify(token, jwtSecretKey, (error, decodedToken) => {
      if (error) {
        // Token verification failed
        
        return res.status(401).json({ 
          message: 'Invalid token',
          error});
      }
  
      const userId = decodedToken.userId; // Extract the user ID from the decoded token
  
      // Retrieve the user profile from the database
      const sqlStatement = 'SELECT * FROM `user` WHERE id=?';
  
      pool.getConnection((err, connection) => {
        if (err) {
          // Handle connection error
          return next({
              status: 500,
              message: 'Failed to get a database connection.'
          });
        }
  
        connection.query(sqlStatement, [userId], (error, results, fields) => {
          connection.release(); // Release the connection after the query
  
          if (error) {
            // Handle query execution error
            return next({
              status: 409,
              message: 'Meal not created.'
            });
          }
  
          if (results.length > 0) {
            // User profile found
            res.status(200).json({
              status: 200,
              message: 'Get User profile',
              data: results[0]
            });
          } else {
            // User profile not found
            res.status(404).json({
              status: 404,
              message: 'User profile not found'
            });
          }
        });
      });
    });
  },
  
  getUserProfileById: (req, res) => {
    logger.info('getUserProfileById called');
    logger.trace('Show user with user id', req.params.userId);

    let sqlStatement = 'SELECT * FROM `user` WHERE id=?';

    pool.getConnection(function (err, conn) {
      // Do something with the connection
      if (err) {
        // Handle connection error
        return next({
            status: 500,
            message: 'Failed to get a database connection.'
        });
      }
      if (conn) {
        conn.query(sqlStatement, [req.params.userId], (err, results, fields) => {
          if (err) {
            // Handle query execution error
            return next({
              status: 409,
              message: 'Meal not created.'
          });
          }
          if (results) {
            logger.trace('Found', results.length, 'results');
            res.status(200).json({
              code: 200,
              message: 'User profile retrieved successfully',
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
    logger.info('deleteUser called');
    logger.trace('Delete user profile', req.params.userId);

    let sqlStatement = 'DELETE FROM `user` WHERE id=?';

    pool.getConnection(function (err, conn) {
      // Do something with the connection
      if (err) {
        // Handle connection error
        return next({
            status: 500,
            message: 'Failed to get a database connection.'
        });
      }
      if (conn) {
        conn.query(sqlStatement, [req.params.userId], (err, results, fields) => {
          if (err) {
            // Handle query execution error
            return next({
              status: 409,
              message: 'Meal not created.'
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
    logger.info('updateUser called');

    // Update user from userId
    logger.info('Update user')
  },
  
}

module.exports = userController;
