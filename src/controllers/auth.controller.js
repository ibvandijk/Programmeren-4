const database = require('../util/inmem-db');
const logger = require('../util/utils').logger;
const assert = require('assert');
const pool = require('../util/mysql-db');
const jwt = require('jsonwebtoken');

const jwtSecretKey = require('../config/config.js').jwtSecretKey;

const authController = {

// UC-101 login function => '/api/login'
    loginUser: (req, res) => {
    logger.info('loginUser called');

    const { emailAdress, password } = req.body;
  
    // Check if emailAdress or password is undefined
    if (!emailAdress || !password) {
      return res.status(400).json({ message: 'emailAdress and password are required' });
    }
  
    pool.getConnection((err, conn) => {
      if (err) {
        console.error('Error establishing database connection:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
  
      try {
        // Execute the SQL query to find the user by email and password
        const sqlQuery = 'SELECT * FROM user WHERE emailAdress = ? AND password = ?';
        conn.query(sqlQuery, [emailAdress, password], (error, results) => {
          conn.release(); // Release the connection after the query
  
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
          const token = jwt.sign({ userId: user.id }, jwtSecretKey);
  
          // Return the token to the client
          res.status(200).json({ token });
        });
      } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  },

    validateToken: (req, res, next) => {
    logger.info('validateToken called');
  
    // Check if the authorization header is present
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn('Authorization header missing!');
      return next({
        status: 401,
        message: 'Authorization header missing!'
      });
    }
  
    // Extract the token from the authorization header
    const token = req.headers.authorization.split(' ')[1];
  
    // Verify the token using the secret key
    jwt.verify(token, jwtSecretKey, (err, payload) => {
      if (err) {
        logger.warn('Not authorized');
        return next({
          status: 401,
          message: 'Not authorized'
        });
      }
  
      // Token is valid, set the userId in the request for future use
      req.userId = payload.id;
      logger.debug('Token is valid', payload);
      next();
    });
  }, 
}

module.exports = authController;

  