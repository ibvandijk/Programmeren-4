process.env.DB_DATABASE = process.env.DB_DATABASE || 'share-a-meal-testdb';
process.env.LOGLEVEL = 'warn';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../index');
const assert = require('assert');
require('dotenv').config();
const dbconnection = require('../../database/dbconnection');
const jwt = require('jsonwebtoken');
const { jwtSecretKey, logger } = require('../../src/config/config');

chai.should();
chai.use(chaiHttp);

// Clearing query's
const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM `meal`;';
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;';
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM `user`;';
const CLEAR_DB =
	CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

//INSERT USER
const INSERT_USER =
	'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `phoneNumber`, `street`, `city` ) VALUES' +
	'(1, "first", "last", "name@server.nl", "Password1!", "0000000000", "street", "city");';
const INSERT_USER2 =
	'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `phoneNumber`, `street`, `city` ) VALUES' +
	'(2, "second", "secondlast", "secondname@server.nl", "Password1!", "0000000000", "secondstreet", "secondcity");';
const INSERT_USER3 =
	'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `phoneNumber`, `street`, `city`, `isActive` ) VALUES' +
	'(3, "third", "thirdlast", "thirdname@server.nl", "Password1!", "0000000000", "thirdstreet", "thirdcity", 0);';
const INSERT_USER4 =
	'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `phoneNumber`, `street`, `city`, `isActive` ) VALUES' +
	'(4, "fourth", "fourthlast", "fourthname@server.nl", "Password1!", "0000000000", "fourthstreet", "fourthcity", 0);';

//INSERT MEAL
const INSERT_MEAL = `INSERT INTO meal (id, isActive, isVega, isVegan, isToTakeHome, dateTime, maxAmountOfParticipants, price, imageUrl, cookId, name, description) VALUES (1, 1, 1, 1, 1, '2022-05-20 06:36:27', 6, 6.75, 'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg', 1, 'Spaghetti Bolognese', 'Dé pastaklassieker bij uitstek.')`;
const INSERT_MEAL2 = `INSERT INTO meal (id, isActive, isVega, isVegan, isToTakeHome, dateTime, maxAmountOfParticipants, price, imageUrl, cookId, name, description) VALUES (2, 0, 0, 0, 0, '2022-06-20 06:36:27', 7, 7.75, 'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg', 2, 'Spaghetti Bolognese 2', 'Dé pastaklassieker bij uitstek 2.')`;

describe('CRUD Users /api/user', () => {
	describe('UC-201 Register New User', () => {
		beforeEach((done) => {
			logger.debug('beforeEach called');
			dbconnection.getConnection(function (err, connection) {
				if (err) throw err;
				connection.query(
					'ALTER TABLE user AUTO_INCREMENT = 1;',
					(error, result, field) => {
						connection.query(
							CLEAR_DB + INSERT_USER,
							function (error, results, fields) {
								connection.release();
								if (error) throw error;
								logger.debug('beforeEach done');
								done();
							}
						);
					}
				);
			});
		});

		it('TC-201-1 Required field is missing /api/user', (done) => {
			chai.request(server)
				.post('/api/user')
				.send({
					lastName: 'Henk',
					street: 'Meulenbroek 21',
					city: 'Bleskensgraaf',
					password: 'Secrets0',
					emailAdress: 'daanvdm@hotmail.com',
				})
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(400);
					message.should.be
						.a('string')
						.that.equals('First Name cannot be null!');
					done();
				});
		});

		it('TC 201-2 Non-valid emailAdress /api/user', (done) => {
			chai.request(server)
				.post('/api/user')
				.send({
					firstName: 'Ingrid',
					lastName: 'Henk',
					street: 'Meulenbroek 21',
					city: 'Bleskensgraaf',
					password: 'Secrets0',
					emailAdress: 'daanvdmhotmail.com',
				})
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(400);
					message.should.be
						.a('string')
						.that.equals('Invalid emailadres');
					done();
				});
		});

		it('TC 201-3 Non-valid password /api/user', (done) => {
			chai.request(server)
				.post('/api/user')
				.send({
					firstName: 'Ingrid',
					lastName: 'Henk',
					street: 'Meulenbroek 21',
					city: 'Bleskensgraaf',
					phoneNumber: '0631490687',
					password: 1,
					emailAdress: 'daanvdm@hotmail.com',
				})
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(400);
					message.should.be
						.a('string')
						.that.equals(
							'Password must contain 8-15 characters which contains at least one lower- and uppercase letter, one special character and one digit'
						);
					done();
				});
		});

		it('TC 201-4 User already exists /api/user', (done) => {
			chai.request(server)
				.post('/api/user')
				.send({
					firstName: 'first',
					lastName: 'last',
					isActive: 1,
					emailAdress: 'name@server.nl',
					password: 'Secrets0',
					phoneNumber: '0631490687',
					roles: 'editor,guest',
					street: 'street',
					city: 'city',
				})
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(409);
					message.should.be
						.a('string')
						.that.equals(
							'The email-address: name@server.nl has already been taken!'
						);
					done();
				});
		});

		it('TC 201-5 User added succesfully /api/user', (done) => {
			chai.request(server)
				.post('/api/user')
				.send({
					firstName: 'Daan',
					lastName: 'van der Meulen',
					isActive: 1,
					emailAdress: 'daanvdm@hotmail.com',
					password: 'Secrets0',
					phoneNumber: '0631490687',
					roles: 'editor,guest',
					street: 'Meulenbroek',
					city: 'Bleksensgraaf',
				})
				.end((err, res) => {
					res.should.be.an('object');
					let { status, result } = res.body;
					status.should.equals(201);
					assert.deepEqual(result, {
						id: 2,
						firstName: 'Daan',
						lastName: 'van der Meulen',
						isActive: 1,
						emailAdress: 'daanvdm@hotmail.com',
						password: 'Secrets0',
						phoneNumber: '0631490687',
						roles: 'editor,guest',
						street: 'Meulenbroek',
						city: 'Bleksensgraaf',
					});
					logger.debug(result);
					done();
				});
		});
	});

	describe('UC-202 User Overview /api/user', () => {
		describe('UC-202-1 Show 0 users/api/user', () => {
			beforeEach((done) => {
				logger.debug('beforeEach called');
				dbconnection.getConnection(function (err, connection) {
					if (err) throw err;
					connection.query(
						CLEAR_DB,
						function (error, results, fields) {
							connection.release();
							if (error) throw error;
							logger.debug('beforeEach done');
							done();
						}
					);
				});
			});

			it('TC-202-2 Show 2 users /api/user', (done) => {
				chai.request(server)
					.get('/api/user')
					.set(
						'authorization',
						'Bearer ' + jwt.sign({ userId: 2 }, jwtSecretKey)
					)
					.end((err, res) => {
						res.should.be.an('object');
						let { status, result } = res.body;
						status.should.equals(200);
						assert.deepEqual(result, []);
						done();
					});
			});
		});

		describe('UC-202-2 Show 2 users/api/user', () => {
			beforeEach((done) => {
				logger.debug('beforeEach called');
				dbconnection.getConnection(function (err, connection) {
					if (err) throw err;
					connection.query(
						CLEAR_DB + INSERT_USER + INSERT_USER2,
						function (error, results, fields) {
							connection.release();
							if (error) throw error;
							logger.debug('beforeEach done');
							done();
						}
					);
				});
			});

			it('TC-202-2 Show 2 users /api/user', (done) => {
				chai.request(server)
					.get('/api/user')
					.set(
						'authorization',
						'Bearer ' + jwt.sign({ userId: 2 }, jwtSecretKey)
					)
					.end((err, res) => {
						res.should.be.an('object');
						let { status, result } = res.body;
						status.should.equals(200);
						assert.deepEqual(result, [
							{
								id: 1,
								firstName: 'first',
								lastName: 'last',
								isActive: 1,
								emailAdress: 'name@server.nl',
								password: 'Password1!',
								phoneNumber: '0000000000',
								roles: 'editor,guest',
								street: 'street',
								city: 'city',
							},
							{
								id: 2,
								firstName: 'second',
								lastName: 'secondlast',
								isActive: 1,
								emailAdress: 'secondname@server.nl',
								password: 'Password1!',
								phoneNumber: '0000000000',
								roles: 'editor,guest',
								street: 'secondstreet',
								city: 'secondcity',
							},
						]);
						done();
					});
			});
		});

		describe('UC-202 Remaining test cases users/api/user', () => {
			beforeEach((done) => {
				logger.debug('beforeEach called');
				dbconnection.getConnection(function (err, connection) {
					if (err) throw err;
					connection.query(
						'ALTER TABLE meal AUTO_INCREMENT = 1;',
						(error, result, field) => {
							connection.query(
								'ALTER TABLE user AUTO_INCREMENT = 1;',
								function (error, result, fields) {
									connection.query(
										CLEAR_DB +
										INSERT_USER +
										INSERT_USER2 +
										INSERT_USER3 +
										INSERT_USER4,
										function (error, results, fields) {
											connection.release();
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

			it('TC-202-3 Show users for non-existing name /api/user', (done) => {
				chai.request(server)
					.get('/api/user?firstName=fa;sldkfj;aslkjdf;lksdjf')
					.set(
						'authorization',
						'Bearer ' + jwt.sign({ userId: 2 }, jwtSecretKey)
					)
					.end((err, res) => {
						res.should.be.an('object');
						let { status, result } = res.body;
						status.should.equals(200);
						result.should.be.an('array').that.lengthOf(0);
						done();
					});
			});

			it('TC-202-4 Show users for isActive=false /api/user', (done) => {
				chai.request(server)
					.get('/api/user?isActive=false')
					.set(
						'authorization',
						'Bearer ' + jwt.sign({ userId: 2 }, jwtSecretKey)
					)
					.end((err, res) => {
						res.should.be.an('object');
						let { status, result } = res.body;
						status.should.equals(200);
						result.should.be.an('array').that.lengthOf(2);
						done();
					});
			});

			it('TC-202-5 Show users for isActive=true /api/user', (done) => {
				chai.request(server)
					.get('/api/user?isActive=true')
					.set(
						'authorization',
						'Bearer ' + jwt.sign({ userId: 2 }, jwtSecretKey)
					)
					.end((err, res) => {
						res.should.be.an('object');
						let { status, result } = res.body;
						status.should.equals(200);
						result.should.be.an('array').that.lengthOf(2);
						done();
					});
			});

			it('TC-202-6 Show users for name=first /api/user', (done) => {
				chai.request(server)
					.get('/api/user?firstName=first')
					.set(
						'authorization',
						'Bearer ' + jwt.sign({ userId: 2 }, jwtSecretKey)
					)
					.end((err, res) => {
						res.should.be.an('object');
						let { status, result } = res.body;
						status.should.equals(200);
						result.should.be.an('array').that.lengthOf(1);
						done();
					});
			});
		});
	});

	describe('UC-203 Get User Profile /api/user', () => {
		beforeEach((done) => {
			logger.debug('beforeEach called');
			dbconnection.getConnection(function (err, connection) {
				if (err) throw err;
				connection.query(
					'ALTER TABLE meal AUTO_INCREMENT = 1;',
					(error, result, field) => {
						connection.query(
							'ALTER TABLE user AUTO_INCREMENT = 1;',
							function (error, result, fields) {
								connection.query(
									CLEAR_DB + INSERT_USER + INSERT_MEAL,
									function (error, results, fields) {
										connection.release();
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

		it('TC-203-1 Invalid token /api/user/profile', (done) => {
			chai.request(server)
				.get('/api/user/profile')
				.set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, 'a'))
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(401);
					message.should.be.a('string').that.equals('Not authorized');
					done();
				});
		});

		it('TC-203-2 Valid token and valid profile /api/user/profile', (done) => {
			chai.request(server)
				.get('/api/user/profile')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
				)
				.send({})
				.end((err, res) => {
					res.should.be.an('object');
					let { status, result } = res.body;
					status.should.equals(200);
					assert.deepEqual(result, {
						city: 'city',
						emailAdress: 'name@server.nl',
						firstName: 'first',
						id: 1,
						isActive: 1,
						lastName: 'last',
						password: 'Password1!',
						phoneNumber: '0000000000',
						roles: 'editor,guest',
						street: 'street',
					});
					done();
				});
		});
	});

	describe('UC-204 Get User Details /api/user/?:id', () => {
		beforeEach((done) => {
			logger.debug('beforeEach called');
			// maak de testdatabase leeg zodat we onze testen kunnen uitvoeren.
			dbconnection.getConnection(function (err, connection) {
				if (err) throw err; // not connected!

				// Use the connection
				connection.query(
					CLEAR_DB + INSERT_USER,
					function (error, results, fields) {
						// When done with the connection, release it.
						connection.release();

						// Handle error after the release.
						if (error) throw error;
						// Let op dat je done() pas aanroept als de query callback eindigt!
						logger.debug('beforeEach done');
						done();
					}
				);
			});
		});

		it('TC-204-1 Invalid token /api/user', (done) => {
			chai.request(server)
				.get('/api/user/1')
				.set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, 'a'))
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(401);
					message.should.be.a('string').that.equals('Not authorized');
					done();
				});
		});

		it('TC-204-2 Invalid userId /api/user', (done) => {
			chai.request(server)
				.get('/api/user/2')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
				)
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(404);
					message.should.be
						.a('string')
						.that.equals('User with ID 2 not found');
					done();
				});
		});

		it('TC-204-3 Valid userId, get one user back /api/user', (done) => {
			chai.request(server)
				.get('/api/user/1')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
				)
				.end((err, res) => {
					res.should.be.an('object');
					let { status, result } = res.body;
					status.should.equals(200);
					assert.deepEqual(result, {
						id: 1,
						firstName: 'first',
						lastName: 'last',
						isActive: 1,
						emailAdress: 'name@server.nl',
						password: 'Password1!',
						phoneNumber: '0000000000',
						roles: 'editor,guest',
						street: 'street',
						city: 'city',
					});
					done();
				});
		});
	});

	describe('UC-205 Edit User Details /api/user', () => {
		beforeEach((done) => {
			logger.debug('beforeEach called');
			dbconnection.getConnection(function (err, connection) {
				if (err) throw err;
				connection.query(
					CLEAR_DB + INSERT_USER,
					function (error, results, fields) {
						connection.release();
						if (error) throw error;
						logger.debug('beforeEach done');
						done();
					}
				);
			});
		});

		it('TC-205-1 Email missing /api/user', (done) => {
			chai.request(server)
				.put('/api/user/1')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
				)
				.send({
					firstName: 'Daan',
					lastName: 'van der Meulen',
					isActive: 1,
					password: 'JeMoeder4!',
					phoneNumber: '0631490687',
					roles: 'editor,guest',
					street: 'Meulenbroek',
					city: 'Bleksensgraaf',
				})
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(400);
					message.should.be
						.a('string')
						.that.equals('emailAdress cannot be null!');
					done();
				});
		});

		it('TC-205-3 Invalid phoneNumber /api/user', (done) => {
			chai.request(server)
				.put('/api/user/1')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
				)
				.send({
					firstName: 'Daan',
					lastName: 'van der Meulen',
					isActive: 1,
					emailAdress: 'daanvdm@hotmail.com',
					password: 'JeMoeder4!',
					phoneNumber: '631490687',
					roles: 'editor,guest',
					street: 'Meulenbroek',
					city: 'Bleksensgraaf',
				})
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(400);
					message.should.be
						.a('string')
						.that.equals('Phonenumber should be 10 digits');
					done();
				});
		});

		it('TC-205-4 User does not exist /api/user', (done) => {
			chai.request(server)
				.put('/api/user/2')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
				)
				.send({
					firstName: 'Daan',
					lastName: 'van der Meulen',
					isActive: 1,
					emailAdress: 'daanvdm@hotmail.com',
					password: 'JeMoeder4!',
					phoneNumber: '0631490687',
					roles: 'editor,guest',
					street: 'Meulenbroek',
					city: 'Bleksensgraaf',
				})
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(400);
					message.should.be
						.a('string')
						.that.equals(
							'Update failed, user with ID 2 does not exist'
						);
					done();
				});
		});

		it('TC-205-5 User not signed in /api/user', (done) => {
			chai.request(server)
				.put('/api/user/1')
				.set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, 'a'))
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(401);
					message.should.be.a('string').that.equals('Not authorized');
					done();
				});
		});

		it('TC-205-6 User succesfully edited /api/user', (done) => {
			chai.request(server)
				.put('/api/user/1')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
				)
				.send({
					firstName: 'Daan',
					lastName: 'van der Meulen',
					isActive: 1,
					emailAdress: 'daanvdm@hotmail.com',
					password: 'JeMoeder4!',
					phoneNumber: '0631490687',
					roles: 'editor,guest',
					street: 'Meulenbroek',
					city: 'Bleksensgraaf',
				})
				.end((err, res) => {
					res.should.be.an('object');
					let { status, result } = res.body;
					status.should.equals(200);
					assert.deepEqual(result, {
						id: 1,
						firstName: 'Daan',
						lastName: 'van der Meulen',
						isActive: 1,
						emailAdress: 'daanvdm@hotmail.com',
						password: 'JeMoeder4!',
						phoneNumber: '0631490687',
						roles: 'editor,guest',
						street: 'Meulenbroek',
						city: 'Bleksensgraaf',
					});
					done();
				});
		});
	});

	describe('UC-206 Delete User', () => {
		beforeEach((done) => {
			logger.debug('beforeEach called');
			dbconnection.getConnection(function (err, connection) {
				if (err) throw err;
				connection.query(
					'ALTER TABLE user AUTO_INCREMENT = 1;',
					function (error, result, fields) {
						connection.query(
							CLEAR_DB +
							INSERT_USER +
							INSERT_USER2 +
							INSERT_USER3,
							function (error, results, fields) {
								connection.release();
								if (error) throw error;
								logger.debug('beforeEach done');
								done();
							}
						);
					}
				);
			});
		});

		it('TC-206-1 User does not exist /api/user', (done) => {
			chai.request(server)
				.delete('/api/user/999')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ userId: 3 }, jwtSecretKey)
				)
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(400);
					message.should.be
						.a('string')
						.that.equals('User does not exist');
					done();
				});
		});

		it('TC-206-2 Not logged in /api/user', (done) => {
			chai.request(server)
				.delete('/api/user/1')
				.set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, 'a'))
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(401);
					message.should.be.a('string').that.equals('Not authorized');
					done();
				});
		});

		it('TC-206-3 Actor is not owner /api/user', (done) => {
			chai.request(server)
				.delete('/api/user/3')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ userId: 2 }, jwtSecretKey)
				)
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(403);
					message.should.be
						.a('string')
						.that.equals('User is not the owner');
					done();
				});
		});

		it('TC-206-4 User deleted succesfully /api/user', (done) => {
			chai.request(server)
				.delete('/api/user/1')
				.set(
					'authorization',
					'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
				)
				.end((err, res) => {
					res.should.be.an('object');
					let { status, message } = res.body;
					status.should.equals(200);
					message.should.be
						.a('string')
						.that.equals('User with ID 1 deleted successfuly!');
					done();
				});
		});
	});
});
