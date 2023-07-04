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
            maxAmountOfParticipants,
        } = meal;

        try {
            // Validate name field
            assert(name !== null && name !== undefined, 'Missing field: name');
            assert(typeof name === 'string', 'name must be a string');

            // Validate maxAmountOfParticipants field
            assert(maxAmountOfParticipants !== null && maxAmountOfParticipants !== undefined, 'Missing field: maxAmountOfParticipants');
            assert(typeof maxAmountOfParticipants === 'number', 'maxAmountOfParticipants must be a number');

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
            // If any validation fails, handle the error
            return next({
                status: 400,
                message: err.message,
                meal
            });
        }
    },

    // UC-301 Toevoegen van maaltijd
    registerMeal: (req, res, next) => {
        logger.info('registerMeal called');
        
        const meal = req.body;
        const cookId = req.userId;
        const price = parseFloat(meal.price);
        
        // Establish a database connection
        pool.getConnection((err, conn) => {
            if (err) {
                // Handle connection error
                return next({
                    status: 500,
                    message: 'Failed to get a database connection.'
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
                    // Handle query execution error
                    return next({
                        status: 409,
                        message: 'Meal not created.'
                    });
                }
            
                // Retrieve the inserted meal from the database
                const selectQuery = 'SELECT * FROM meal ORDER BY id DESC LIMIT 1;';
                conn.query(selectQuery, (error, results, fields) => {
                    conn.release();

                    if (error) {
                        // Handle query execution error
                        return next({
                            status: 500,
                            message: 'Failed to retrieve meal from the database.'
                        });
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
                    message: 'Successfully added meal.',
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
        const userId = req.userId;

        let price = parseFloat(newMealInfo.price);

        pool.getConnection((err, conn) => {
            if (err) {
                // Handle connection error
                return next({
                    status: 500,
                    message: 'Failed to get a database connection.'
                });
            }

            const sqlSelectQuery = 'SELECT * FROM meal WHERE id = ?';

            conn.query(sqlSelectQuery, [mealId], (error, results, fields) => {
                if (error) {
                    conn.release();
                    return next({
                        status: 500,
                        message: 'Failed to retrieve meal from the database.'
                    });
                }

                if (results.length === 0) {
                    conn.release();
                    return next({
                        status: 404,
                        message: `Meal with ID ${mealId} not found`
                    });
                }

                const meal = results[0];

                if (meal.cookid !== userId) {
                    conn.release();
                    return next({
                        status: 403,
                        message: 'Unauthorized: You are not allowed to update this meal.'
                    });
                }

                const sqlUpdateQuery =
                    `UPDATE meal SET name = ?, description = ?, isActive = ?, isVega = ?, isVegan = ?, isToTakeHome = ?, imageUrl = ?, maxAmountOfParticipants = ?, price = ? WHERE id = ?`;

                // ensures that the booleans are converted to 0 or 1, for the query.
                newMealInfo.isActive = (newMealInfo.isActive) ? 1 : 0
                newMealInfo.isVega = (newMealInfo.isVega) ? 1 : 0
                newMealInfo.isVegan = (newMealInfo.isVegan) ? 1 : 0
                newMealInfo.isToTakeHome = (newMealInfo.isToTakeHome) ? 1 : 0
                conn.query(
                    sqlUpdateQuery,
                    [
                        newMealInfo.name,
                        newMealInfo.description,
                        newMealInfo.isActive,
                        newMealInfo.isVega,
                        newMealInfo.isVegan,
                        newMealInfo.isToTakeHome,
                        newMealInfo.imageUrl,
                        newMealInfo.maxAmountOfParticipants,
                        price,
                        mealId
                    ],
                    (error, results, fields) => {
                        conn.release();

                        if (error) {
                            logger.error(500, error);
                            return next({
                                status: 500,
                                message: 'Failed to update meal in the database.',
                                data: error
                            });
                        }

                        if (results.affectedRows > 0) {
                            // Retrieve the updated meal from the database
                            conn.query(
                                'SELECT * FROM meal WHERE id = ?',
                                [mealId],
                                (error, results, fields) => {
                                    if (error) {
                                        // Handle query execution error
                                        return next({
                                            status: 500,
                                            message: 'Failed to retrieve meal from the database.'
                                        });
                                    }

                                    const updatedMeal = results[0];
                                    updatedMeal.price = price;
                                    updatedMeal.isActive = newMealInfo.isActive ? true : false;
                                    updatedMeal.isVega = newMealInfo.isVega ? true : false;
                                    updatedMeal.isVegan = newMealInfo.isVegan ? true : false;
                                    updatedMeal.isToTakeHome = newMealInfo.isToTakeHome ? true : false;

                                    res.status(200).json({
                                        status: 200,
                                        message: 'Update Meal by ID',
                                        result: updatedMeal
                                    });
                                }
                            );
                        } else {
                            return next({
                                status: 404,
                                message: `Meal with ID ${mealId} not found`
                            });
                        }
                    }
                );
            });
        });
    },
      
        

    
    // UC-303 Opvragen van alle maaltijden
    getAllMeals: (req, res, next) => {
        logger.info('getAllMeals called');

        // Establish a database connection
        pool.getConnection((err, conn) => {
            if (err) {
                // Handle connection error
                return next({
                    status: 500,
                    message: 'Failed to get a database connection.'
                });
            }

            // Define the query to retrieve all meals
            const query = 'SELECT * FROM meal';

            // Execute the query
            conn.query(query, (error, result, fields) => {
                conn.release();

                if (error) {
                    // Handle query execution error
                    return next({
                        status: 500,
                        message: 'Failed to retrieve meals from the database.'
                    });
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
                return next({
                    status: 500,
                    message: 'Failed to get a database connection.'
                });
            }

            // Execute the SQL query
            conn.query(sqlStatement, [mealId], (err, results, fields) => {
                conn.release();

                if (err) {
                    return next({
                        status: 500,
                        message: 'Failed to retrieve meal from the database.'
                    });
                }

                if (results.length < 1) {
                    return next({
                        status: 404,
                        message: `Meal with ID: ${mealId} not found!`
                    });
                }

                // Modify result properties to boolean values
                results[0].isActive = !!results[0].isActive;
                results[0].isVega = !!results[0].isVega;
                results[0].isVegan = !!results[0].isVegan;
                results[0].isToTakeHome = !!results[0].isToTakeHome;

                // Send the result as a response
                res.status(200).json({
                    status: 200,
                    message: 'Meal retrieved successfully.',
                    data: results[0]
                });
            });
        });
    },


    // UC-305 Verwijderen van maaltijd
    deleteMealById: (req, res, next) => {
        logger.info('deleteMealById called');
    
        const mealId = req.params.mealId;
        const userId = req.userId;
    
        pool.getConnection((err, conn) => {
            if (err) {
                // Handle connection error
                return next({
                    status: 500,
                    message: 'Failed to get a database connection.'
                });
            }
    
            conn.query(
                'SELECT cookId FROM meal WHERE id = ?',
                [mealId],
                (error, results) => {
                    if (error) {
                        // Handle query error
                        conn.release();
                        return next({
                            status: 500,
                            message: 'Failed to delete meal from database.'
                        });
                    }
    
                    if (results.length === 0) {
                        // No meal found with the provided mealId
                        conn.release();
                        return next({
                            status: 404,
                            message: `Meal with ID ${mealId} not found.`
                        });
                    }
    
                    const meal = results[0];
                    if (meal.cookId !== userId) {
                        // The meal does not belong to the user
                        conn.release();
                        return next({
                            status: 403,
                            message: 'Unauthorized: You are not allowed to update this meal.'
                        });
                    }
    
                    conn.query(
                        'DELETE FROM meal WHERE id = ?',
                        [mealId],
                        (deleteError, deleteResults) => {
                            conn.release();
    
                            if (deleteError) {
                                // Handle delete query error
                                return next({
                                    status: 500,
                                    message: 'Failed to delete meal.'
                                });
                            }
    
                            if (deleteResults.affectedRows === 0) {
                                // No meal found with the provided mealId
                                return next({
                                    status: 404,
                                    message: `Meal with ID: ${mealId} not found!`
                                });
                            }
    
                            res.status(200).json({
                                status: 200,
                                message: 'Meal with ID ${mealId} successfully deleted.'
                            });
                        }
                    );
                }
            );
        });
    },
}

module.exports = mealController;