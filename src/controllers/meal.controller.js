const logger = require('../util/utils').logger;
const assert = require('assert');

const database = require('../util/inmem-db');
const pool = require('../util/mysql-db');

const jwt = require('jsonwebtoken');

const mealController = {

    validateMeal: (req, res, next) => {
        logger.info('validateMeal called');
        let meal = req.body;

        // Extract required fields
        let {
            name,
            description,
            isToTakeHome,
            imageUrl,
            price,
            isVega,
            isVegan,
            isActive,
            dateTime,
        } = meal;

        try {
            // Validate imageUrl field
            assert(typeof imageUrl === 'string', 'ImageUrl must be a string');

            // Validate name field
            assert(typeof name === 'string', 'Name must be a string');

            // Validate description field
            assert(typeof description === 'string', 'Description should be a string!');

            // Validate price field
            assert(typeof price === 'number', 'Price must be a number');

            // Validate dateTime field
            assert(typeof dateTime === 'string', 'DateTime must be a string');

            // Validate isToTakeHome field
            assert(isToTakeHome != null, 'isToTakeHome cannot be null');

            // Validate isVega field
            assert(isVega != null, 'isVega cannot be null');

            // Validate isVegan field
            assert(isVegan != null, 'isVegan cannot be null');

            // Validate isActive field
            assert(isActive != null, 'isActive cannot be null');

            next();
        } catch (err) {
            // If any validation fails, handle the error and pass it to the next middleware
            const error = { status: 400, message: err.message };
            next(error);
        }
    },

    // UC-301 Toevoegen van maaltijd
    registerMeal: (req, res, next) => {
        logger.info('registerMeal called');
        
        const meal = req.body;
        const cookId = req.userId;
        const price = parseFloat(meal.price);
        
        logger.debug(meal);
        
        // Establish a database connection
        dbconnection.getConnection((err, connection) => {
            if (err) {
            const error = {
                status: 500,
                message: 'Failed to establish database connection.',
            };
            return next(error);
            }
        
            // Add new meal to the database
            const insertQuery = `
            INSERT INTO meal (datetime, maxAmountOfParticipants, price, imageUrl, cookId, name, description, isActive, isVega, isVegan, isToTakeHome)
            VALUES (STR_TO_DATE(?, '%Y-%m-%dT%H:%i:%s.%fZ'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
        
            const insertParams = [
            meal.dateTime,
            meal.maxAmountOfParticipants,
            price,
            meal.imageUrl,
            cookId,
            meal.name,
            meal.description,
            meal.isActive,
            meal.isVega,
            meal.isVegan,
            meal.isToTakeHome,
            ];
        
            connection.query(insertQuery, insertParams, (error, results, fields) => {
            
                if (error) {
                    logger.debug(error);
                    const newError = {
                    status: 409,
                    message: `Meal not created.`,
                    };
                    return next(newError);
                }
            
                // Retrieve the inserted meal from the database
                const selectQuery = 'SELECT * FROM meal ORDER BY id DESC LIMIT 1;';
                connection.query(selectQuery, (error, results, fields) => {
                    connection.release();
                    
                    if (error) {
                    const newError = {
                        status: 500,
                        message: 'Failed to retrieve inserted meal from the database.',
                    };
                    return next(newError);
                    }
            
                    const insertedMeal = results[0];
            
                    // Update properties of the inserted meal
                    insertedMeal.price = price;
                    insertedMeal.isActive = meal.isActive ? true : false;
                    insertedMeal.isVega = meal.isVega ? true : false;
                    insertedMeal.isVegan = meal.isVegan ? true : false;
                    insertedMeal.isToTakeHome = meal.isToTakeHome ? true : false;
            
                    // Send a 201 status with the inserted meal as a response
                    res.status(201).json({
                    status: 201,
                    result: insertedMeal,
                    });
                });
            });
        });
    },   
    
    // UC-303 Opvragen van alle maaltijden
    getAllMeals: (req, res, next) => {
        logger.info('getAllMeals called');
      
        dbconnection.getConnection((error, connection) => {
          if (error) {
            const newError = {
              status: 500,
              message: 'Failed to establish database connection.',
            };
            return next(newError);
          }
      
          const query = 'SELECT * FROM meal';
      
          connection.query(query, (error, result, fields) => {
            connection.release();
      
            if (error) {
              const newError = {
                status: 500,
                message: 'Failed to retrieve meals from the database.',
              };
              return next(newError);
            }
      
            logger.debug('result=', result.length);
            res.status(200).json({
              status: 200,
              result: result,
            });
          });
        });
      },
      
}