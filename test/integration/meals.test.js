process.env.DB_DATABASE = process.env.DB_DATABASE || 'shareameal';
process.env.LOGLEVEL = 'warn';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../app');
const assert = require('assert');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const jwtSecretKey = require('../../src/config/config').jwtSecretKey;
const logger = require('../../src/util/utils').logger;
const pool = require('../../src/util/mysql-db');
const userController = require('../../src/controllers/user.controller');
const expect = chai.expect;

chai.should();
chai.use(chaiHttp);



// Clearing queries
const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM meal;';
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM meal_participants_user;';
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM user;';
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

// INSERT USER
const INSERT_USER =
	'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `phoneNumber`, `street`, `city` ) VALUES' +
	'(1, "John", "Doe", "johndoe@example.com", "Password1!", "123456789", "123 Street", "City");';
const INSERT_USER2 =
	'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `phoneNumber`, `street`, `city` ) VALUES' +
	'(2, "Jane", "Doe", "janedoe@example.com", "Password2!", "987654321", "456 Street", "City");';

// INSERT MEAL
const INSERT_MEAL =
	`INSERT INTO meal (id, isActive, isVega, isVegan, isToTakeHome, dateTime, maxAmountOfParticipants, price, imageUrl, cookId, name, description) 
	VALUES (1, 1, 1, 1, 1, '2022-05-20 06:36:27', 6, 6.75, 'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg', 1, 'Pasta Bolognese', 'The ultimate pasta classic.')`;
const INSERT_MEAL2 =
	`INSERT INTO meal (id, isActive, isVega, isVegan, isToTakeHome, dateTime, maxAmountOfParticipants, price, imageUrl, cookId, name, description) 
	VALUES (2, 0, 0, 0, 0, '2022-06-20 06:36:27', 7, 7.75, 'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg', 2, 'Lasagna', 'Layers of deliciousness.')`;

// INSERT PARTICIPATION
const INSERT_PARTICIPATION = `INSERT INTO meal_participants_user (mealId, userId) VALUES (1, 1);`;


describe('CRUD Meals /api/meal', () => {
	// ----- UC-301 start -----
	describe('UC-301 Register Meal', () => {
		beforeEach((done) => {
			logger.debug('beforeEach called');
			pool.getConnection(function (err, conn) {
				if (err) { throw err };
				conn.query(
					'ALTER TABLE `meal` AUTO_INCREMENT = 1;',
					(error, result, field) => {
						conn.query(
							'ALTER TABLE `user` AUTO_INCREMENT = 1;',
							function (error, result, fields) {
								conn.query(
									CLEAR_DB + INSERT_USER + INSERT_MEAL,
									function (error, results, fields) {
										conn.release();
										if (error) throw error;
										logger.debug('beforeEach done');
										done();
									}
								);
							}
						);
					}
				);
			});
		});
		it('TC-301-1 Required field missing', (done) => {
			const mealData = {
				maxAmountOfParticipants: 4,
				price: 12.75,
				imageUrl: 'https://example.com/pasta.jpg',
				name: 'Delicious Pasta',
			};

			chai.request(server)
				.post('/api/meal')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ id: 1 }, jwtSecretKey)
				)
				.send(mealData)
				.end((err, res) => {
					res.should.be.an('object');
					const { statusCode, message } = res.body;
					// Verify that the response status and error message are correct
					expect(statusCode).to.equal(400);
					expect(message).to.equal('Missing field: description');
					done();
				});
		});
		it('TC-301-2 User not logged in', (done) => {
			const mealData = {
				maxAmountOfParticipants: 4,
				price: 12.75,
				imageUrl: 'https://example.com/pasta.jpg',
				name: 'Delicious Pasta',
				description: 'A mouthwatering pasta dish.'
			};

			chai.request(server)
				.post('/api/meal')
				.send(mealData)
				.end((err, res) => {
					res.should.be.an('object');
					const { statusCode, message } = res.body;
					// Verify that the response status and error message are correct
					expect(statusCode).to.equal(401);
					expect(message).to.equal('Authorization header missing!');
					done();
				});
		});

		it('TC-301-3 Successfully created meal', (done) => {
			const mealData = {
				maxAmountOfParticipants: 4,
				price: 12.75,
				imageUrl: 'https://example.com/pasta.jpg',
				name: 'Delicious Pasta',
				description: 'A mouthwatering pasta dish.',
				isActive: true,
				isVega: true,
				isVegan: false,
				isToTakeHome: false,
				dateTime: "2023-05-21T12:00:00.000Z"
			};

			chai.request(server)
				.post('/api/meal')
				.set('authorization', 'Bearer ' + jwt.sign({ id: 1 }, jwtSecretKey))
				.send(mealData)
				.end((err, res) => {
					res.should.be.an('object');
					const { status, result } = res.body;
					// Verify that the response status and result object are correct
					expect(status).to.equal(201);
					expect(result).to.be.an('object');
					expect(result.maxAmountOfParticipants).to.equal(mealData.maxAmountOfParticipants);
					expect(result.price).to.equal(mealData.price);
					expect(result.imageUrl).to.equal(mealData.imageUrl);
					expect(result.name).to.equal(mealData.name);
					expect(result.description).to.equal(mealData.description);
					expect(result.isActive).to.equal(mealData.isActive);
					expect(result.isVega).to.equal(mealData.isVega);
					expect(result.isVegan).to.equal(mealData.isVegan);
					expect(result.isToTakeHome).to.equal(mealData.isToTakeHome);
					done();
				});
		});
	});
	// ----- UC-301 end -----

	// ----- UC-302 start -----
	describe('UC-302 Update Meal', () => {
		beforeEach((done) => {
			logger.debug('beforeEach called');
			pool.getConnection(function (err, conn) {
				if (err) { throw err };
				conn.query(
					'ALTER TABLE `meal` AUTO_INCREMENT = 1;',
					(error, result, field) => {
						conn.query(
							'ALTER TABLE `user` AUTO_INCREMENT = 1;',
							function (error, result, fields) {
								conn.query(
									CLEAR_DB + INSERT_USER + INSERT_MEAL,
									function (error, results, fields) {
										conn.release();
										if (error) throw error;
										logger.debug('beforeEach done');
										done();
									}
								);
							}
						);
					}
				);
			});
		});
		it('TC-302-1 Required field missing', (done) => {
			const mealId = 1;
			const updatedFields = {
				price: 9.99,
				name: 'Chicken dinner'
			};

			chai.request(server)
				.put(`/api/meal/${mealId}`)
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ id: 1 }, jwtSecretKey))
				.send(updatedFields)
				.end((err, res) => {
					res.should.be.an('object');
					const { statusCode, message } = res.body;
					// Verify that the response status and error message are correct
					expect(statusCode).to.equal(400);
					expect(message).to.equal('Missing field: maxAmountOfParticipants');
					done();
				});
		});
		it('TC-302-2 Not logged in', (done) => {
			const mealId = 1;
			const updatedFields = {
				price: 9.99,
				name: 'Chicken dinner'
			};

			chai.request(server)
				.put(`/api/meal/${mealId}`)
				.send(updatedFields)
				.end((err, res) => {
					res.should.be.an('object');
					const { statusCode, message } = res.body;
					// Verify that the response status and error message are correct
					expect(statusCode).to.equal(401);
					expect(message).to.equal('Authorization header missing!');
					done();
				});
		});
		it('TC-302-3 Not the meal owner', (done) => {
			const mealId = 1;
			const updatedFields = {
				name: "Sample Meal",
				description: "This is a delicious meal.",
				isToTakeHome: true,
				imageUrl: "https://example.com/meal-image.jpg",
				price: 10.99,
				isVega: true,
				isVegan: false,
				isActive: true,
				dateTime: "2023-05-21T12:00:00Z",
				maxAmountOfParticipants: 4
			};

			chai.request(server)
				.put(`/api/meal/${mealId}`)
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ id: 2 }, jwtSecretKey)
				)
				.send(updatedFields)
				.end((err, res) => {
					res.should.be.an('object');
					const { statusCode, message } = res.body;
					// Verify that the response status and error message are correct
					expect(statusCode).to.equal(403);
					expect(message).to.equal('Unauthorized: You are not allowed to update this meal.');
					done();
				});
		});

		it('TC-302-4 Meal does not exist', (done) => {
			const mealId = 999;
			const updatedFields = {
				name: "Sample Meal",
				description: "This is a delicious meal.",
				isToTakeHome: true,
				imageUrl: "https://example.com/meal-image.jpg",
				price: 10.99,
				isVega: true,
				isVegan: false,
				isActive: true,
				dateTime: "2023-05-21 12:00:00",
				maxAmountOfParticipants: 4
			};

			chai.request(server)
				.put(`/api/meal/${mealId}`)
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ id: 1 }, jwtSecretKey)
				)
				.send(updatedFields)
				.end((err, res) => {
					res.should.be.an('object');
					const { statusCode, message } = res.body;
					// Verify that the response status and error message are correct
					expect(statusCode).to.equal(404);
					expect(message).to.equal(`Meal with ID ${mealId} not found`);
					done();
				});
		});

	 	it('TC-302-5 Meal updated succesfully', (done) => {
	 		const mealId = 1;
	 		const updatedFields = {
	 			name: "Sample Meal",
	 			description: "This is a delicious meal.",
	 			isToTakeHome: true,
	 			imageUrl: "https://example.com/meal-image.jpg",
	 			price: 10.99,
	 			isVega: true,
	 			isVegan: false,
	 			isActive: true,
	 			dateTime: "2023-05-21T12:00:00Z",
	 			maxAmountOfParticipants: 4
	 		};

	 		chai.request(server)
	 			.put(`/api/meal/${mealId}`)
	 			.set(
	 				'authorization',
	 				'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
	 			)
	 			.send(updatedFields)
	 			.end((err, res) => {
	 				res.should.be.an('object');
	 				let { statusCode, result } = res.body;
	 				// Verify that the response status and error message are correct
	 				//expect(statusCode).to.equal(200);
	 				expect(result.description).to.equal(updatedFields.description);
	 				expect(result.imageUrl).to.equal(updatedFields.imageUrl);
	 				expect(result.isActive).to.equal(updatedFields.isActive);
	 				expect(result.isToTakeHome).to.equal(updatedFields.isToTakeHome);
	 				expect(result.isVega).to.equal(updatedFields.isVega);
	 				expect(result.isVegan).to.equal(updatedFields.isVegan);
	 				expect(result.maxAmountOfParticipants).to.equal(updatedFields.maxAmountOfParticipants);
	 				expect(result.name).to.equal(updatedFields.name);
	 				expect(result.price).to.equal(updatedFields.price);

	 				done();
	 			});
	 	});
	});
	// ----- UC-302 end -----

	// ----- UC-303 start -----
	describe('UC-303 Request List of meals', () => {
		beforeEach((done) => {
			logger.debug('beforeEach called');
			pool.getConnection(function (err, conn) {
				if (err) throw err;
				conn.query(
					'ALTER TABLE meal AUTO_INCREMENT = 1;',
					(error, result, field) => {
						conn.query(
							'ALTER TABLE user AUTO_INCREMENT = 1;',
							function (error, result, fields) {
								conn.query(
									CLEAR_DB + INSERT_USER + INSERT_MEAL,
									function (error, results, fields) {
										conn.release();
										if (error) throw error;
										logger.debug('beforeEach done');
										done();
									}
								);
							}
						);
					}
				);
			});
		});

		it('TC-303-1 Get List of meals', (done) => {
			chai.request(server)
				.get('/api/meal')
				.end((err, res) => {
					res.should.be.an('object');
					let { status, result } = res.body;
					status.should.equals(200);
					result.should.be.an('array').that.lengthOf(1);
					done();
				});
		});
	});

	// ----- UC-303 end -----

	// ----- UC-304 start -----
	describe('UC-304 Request Meal Details', () => {
		beforeEach((done) => {
			logger.debug('beforeEach called');
			pool.getConnection(function (err, conn) {
				if (err) throw err;
				conn.query(
					'ALTER TABLE meal AUTO_INCREMENT = 1;',
					(error, result, field) => {
						conn.query(
							'ALTER TABLE user AUTO_INCREMENT = 1;',
							function (error, result, fields) {
								conn.query(
									CLEAR_DB + INSERT_USER + INSERT_MEAL,
									function (error, results, fields) {
										conn.release();
										if (error) throw error;
										logger.debug('beforeEach done');
										done();
									}
								);
							}
						);
					}
				);
			});
		});

		it('TC-304-1 Meal does not exist', (done) => {
			const mealId = 2;

			chai.request(server)
				.get(`/api/meal/${mealId}`)
				.set('authorization', 'Bearer ' + jwt.sign({ id: 1 }, jwtSecretKey))
				.end((err, res) => {
					res.should.be.an('object');
					const { statusCode, message } = res.body;
					// Verify that the response status and error message are correct
					expect(statusCode).to.equal(404);
					expect(message).to.equal('Meal with ID: 2 not found!');
					done();
				});
		});
		  

		it('TC-304-2 Successfull meal detail', (done) => {
			const mealId = 1;

			chai.request(server)
				.get(`/api/meal/${mealId}`)
				.set('authorization', 'Bearer ' + jwt.sign({ id: 1 }, jwtSecretKey))
				.end((err, res) => {
					res.should.be.an('object');
					const { status, message } = res.body;
					// Verify that the response status and error message are correct
					expect(status).to.equal(200);
					expect(message).to.equal('Meal retrieved successfully.')
					done();
				});
		});
	});
	// ----- UC-304 end -----

	// ----- UC-305 start -----
});