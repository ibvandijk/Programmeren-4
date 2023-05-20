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
            // Validate name field
            assert(name !== null && name !== undefined, 'Missing field: name');
            assert(typeof name === 'string', 'name must be a string');

            // Validate imageUrl field
            assert(imageUrl !== null && imageUrl !== undefined, 'Missing field: imageUrl');
            assert(typeof imageUrl === 'string', 'imageUrl must be a string');

            // Validate description field
            assert(description !== null && description !== undefined, 'Missing field: description');
            assert(typeof description === 'string', 'description must be a string');

            // Validate price field
            assert(price !== null && price !== undefined, 'Missing field: price');
            assert(typeof price === 'number', 'price must be a number');

            // Validate dateTime field
            assert(dateTime !== null && dateTime !== undefined, 'Missing field: dateTime');
            assert(typeof dateTime === 'string', 'dateTime must be a string');

            // Validate isToTakeHome field
            assert(isToTakeHome !== null && isToTakeHome !== undefined, 'Missing field: isToTakeHome');
            assert(typeof isToTakeHome === 'boolean', 'isToTakeHome must be a boolean');

            // Validate isVega field
            assert(isVega !== null && isVega !== undefined, 'Missing field: isVega');
            assert(typeof isVega === 'boolean', 'isVega must be a boolean');

            // Validate isVegan field
            assert(isVegan !== null && isVegan !== undefined, 'Missing field: isVegan');
            assert(typeof isVegan === 'boolean', 'isVegan must be a boolean');

            // Validate isActive field
            assert(isActive !== null && isActive !== undefined, 'Missing field: isActive');
            assert(typeof isActive === 'boolean', 'isActive must be a boolean');

            next();
        } catch (err) {
            // If any validation fails, handle the error and pass it to the next middleware
            const error = { status: 400, message: err.message, meal};
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
        pool.getConnection((err, conn) => {
            if (err) {
            // Handle connection error
            logger.error(err.code, err.syscall, err.address, err.port);
            return next({
                code: 500,
                message: err.code
            });
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
        
            conn.query(insertQuery, insertParams, (error, results, fields) => {
            
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
                conn.query(selectQuery, (error, results, fields) => {
                    conn.release();

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
    
    
    // UC-302 Wijzingen van maaltijdgegevens
	updateMealById: (req, res, next) => {
        const mealId = req.params.mealId;
        const newMealInfo = req.body;
        const price = parseFloat(newMealInfo.price);
        const updateAllergenes = req.body.allergenes.join();
      
        pool.getConnection((err, conn) => {
          if (err) {
            const error = {
              code: 500,
              message: err.code
            };
            return next(error);
          }
      
          const sqlUpdateQuery =
            'UPDATE meal SET name = ?, description = ?, isActive = ?, isVega = ?, isVegan = ?, isToTakeHome = ?, dateTime = STR_TO_DATE(?,"%Y-%m-%dT%H:%i:%s.%fZ"), imageUrl = ?, allergenes = ?, maxAmountOfParticipants = ?, price = ? WHERE id = ?';
      
          conn.query(
            sqlUpdateQuery,
            [
              newMealInfo.name,
              newMealInfo.description,
              newMealInfo.isActive,
              newMealInfo.isVega,
              newMealInfo.isVegan,
              newMealInfo.isToTakeHome,
              newMealInfo.dateTime,
              newMealInfo.imageUrl,
              updateAllergenes,
              newMealInfo.maxAmountOfParticipants,
              price,
              mealId
            ],
            (error, results, fields) => {
                conn.release();
        
                if (error) {
                    const newError = {
                    code: 404,
                    message: `Meal with ID ${mealId} not found`
                    };
                    return next(newError);
                }
        
                if (results.affectedRows > 0) {
                    dbconnection.query(
                    'SELECT * FROM meal WHERE id = ?',
                    [mealId],
                    (error, results, fields) => {
                        if (error) {
                        const newError = {
                            code: 500,
                            message: error.message
                        };
                        return next(newError);
                        }
        
                        results[0].price = price;
                        results[0].isActive = newMealInfo.isActive ? true : false;
                        results[0].isVega = newMealInfo.isVega ? true : false;
                        results[0].isVegan = newMealInfo.isVegan ? true : false;
                        results[0].isToTakeHome = newMealInfo.isToTakeHome ? true : false;
        
                        res.status(200).json({
                        code: 200,
                        message: 'Update Meal by ID',
                        result: results[0]
                        });
                    }
                    );
                } else {
                    const error = {
                    code: 404,
                    message: `Meal with ID ${mealId} not found`
                    };
                    return next(error);
                }
            }
            );
        });
    },
        

    
    // UC-303 Opvragen van alle maaltijden
    getAllMeals: (req, res, next) => {
        logger.info('getAllMeals called');

        // Establish a database connection
        pool.getConnection((err, conn) => {
            if (err) {
            // Handle connection error
            logger.error(err.code, err.syscall, err.address, err.port);
            return next({
                code: 500,
                message: err.code
            });
            }

            // Define the query to retrieve all meals
            const query = 'SELECT * FROM meal';

            // Execute the query
            conn.query(query, (error, result, fields) => {
                conn.release();

                if (error) {
                    // Handle query execution error
                    const newError = {
                    status: 500,
                    message: 'Failed to retrieve meals from the database.',
                    };
                    return next(newError);
                }

                // Return the retrieved meals as a response
                res.status(200).json({
                    status: 200,
                    result: result,
                });
            });
        });
    },

    // UC-304 Opvragen van maaltijd bij ID
	getMealById: (req, res, next) => {
        logger.info('getMealById called');

        const mealId = req.params.mealId;
        const sqlStatement = 'SELECT * FROM meal WHERE id = ?';
      
        // Get a connection from the pool
        pool.getConnection((err, conn) => {
            if (err) {
            // Handle connection error
            logger.error(err.code, err.syscall, err.address, err.port);
            return next({
                code: 500,
                message: err.code
            });
            }
        
            // Execute the SQL query
            connection.query(sqlStatement, [mealId], (err, results, fields) => {
                connection.release();
            
                if (err) {
                    logger.error(err.message);
                    return next({
                    code: 409,
                    message: err.message
                    });
                }
            
                if (results.length < 1) {
                    const error = {
                    code: 404,
                    message: `Meal with ID: ${mealId} not found!`
                    };
                    return next(error);
                }
            
                // Modify result properties to boolean values
                results[0].isActive = !!results[0].isActive;
                results[0].isVega = !!results[0].isVega;
                results[0].isVegan = !!results[0].isVegan;
                results[0].isToTakeHome = !!results[0].isToTakeHome;
            
                // Send the result as a response
                res.status(200).json({
                    code: 200,
                    message: 'Get Meal by ID',
                    data: results[0]
                });
            });
        });
    },

    deleteMealById: (req, res, next) => {
        logger.info('deleteMealById called');

        const mealId = req.params.mealId;
      
        pool.getConnection((err, conn) => {
            if (err) {
            // Handle connection error
            logger.error(err.code, err.syscall, err.address, err.port);
            return next({
                code: 500,
                message: err.code
            });
            }
      
          conn.query(
                'DELETE FROM meal WHERE id = ?',
                [mealId],
                (error, results) => {
                    conn.release();
            
                    if (error) {
                        // Handle query error
                        const error = {
                        status: 500,
                        message: 'Failed to delete meal.',
                        };
                        next(error);
                        return;
                    }
            
                    if (results.affectedRows === 0) {
                        // No meal found with the provided mealId
                        const error = {
                        status: 404,
                        message: `Meal with ID ${mealId} not found.`,
                        };
                        next(error);
                        return;
                    }
            
                    res.status(200).json({
                        status: 200,
                        message: `Meal with ID ${mealId} successfully deleted.`,
                    });
                }
            );
        });
    }, 
}

module.exports = mealController;