const database = require('../util/inmem-db');
const logger = require('../util/utils').logger;
const assert = require('assert');
const pool = require('../util/mysql-db');
const jwt = require('jsonwebtoken');

const userController = {

  // UC-101 login function => '/api/login' 
  loginUser: (req, res) => {
    logger.trace('Login user ', req.params.userId);
    
    const { email, password } = req.body;

    try {
      // Execute the SQL query to find the user by email and password
      const sqlQuery = 'SELECT * FROM user WHERE email = ? AND password = ?';
      dbconnection.query(sqlQuery, [email, password], (error, results) => {
        if (error) {
          console.error('Error executing SQL query:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        // Check if the user exists
        if (results.length === 0) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = results[0];

        // Generate a JWT token
        const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });

        // Return the token to the client
        res.status(200).json({ token });
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },


  // UC-201 Registreren als nieuwe user
  createUser: (req, res) => {
		let user = req.body;

		// Establish a database connection
    pool.getConnection(function (err, connection) {
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
  getUserList: (req, res) => {
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
      if (err) throw err;
      connection.query(dbQuery, function (error, results, fields) {
        connection.release();
        if (error) throw error;
  
        // Convert isActive property to boolean
        const userList = results.map(user => {
          return {
            ...user,
            isActive: !!user.isActive,
          };
        });
  
        res.status(200).json({
          status: 200,
          users: userList,
        });
      });
    });
  },

  // UC-203 Opvragen van gebruikersprofiel
  getUserProfile: (req, res, next) => {
    const token = req.headers.authorization; // the token is sent in the request headers as "Authorization"
  
    // Verify and decode the JWT token
    jwt.verify(token, 'your-secret-key', (error, decodedToken) => {
      if (error) {
        // Token verification failed
        return res.status(401).json({ message: 'Invalid token' });
      }
  
      const userId = decodedToken.userId; // Extract the user ID from the decoded token
  
      // Retrieve the user profile from the database
      const sqlStatement = 'SELECT * FROM `user` WHERE id=?';
  
      dbconnection.getConnection((err, connection) => {
        if (err) {
          console.error('Error getting database connection:', err);
          return res.status(500).json({ message: 'Database connection error' });
        }
  
        connection.query(sqlStatement, [userId], (error, results, fields) => {
          connection.release(); // Release the connection after the query
  
          if (error) {
            console.error('Error executing SQL query:', error);
            return res.status(500).json({ message: 'Internal server error' });
          }
  
          if (results.length > 0) {
            // User profile found
            res.status(200).json({
              code: 200,
              message: 'Get User profile',
              data: results[0]
            });
          } else {
            // User profile not found
            res.status(404).json({
              code: 404,
              message: 'User profile not found'
            });
          }
        });
      });
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
