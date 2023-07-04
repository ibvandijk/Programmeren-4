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
	'(1, "John", "Doe", "johndoe@example.com", "secret", "123456789", "123 Street", "City");';

describe('UC-101 Inloggen', () => {
	beforeEach((done) => {
		logger.debug('beforeEach called');
		pool.getConnection((err, conn) => {
			if (err) throw err;
			conn.query(
				'ALTER TABLE `meal` AUTO_INCREMENT = 1;',
				(error, result, field) => {
					conn.query(
						'ALTER TABLE `user` AUTO_INCREMENT = 1;',
						(error, result, fields) => {
							conn.query(CLEAR_DB + INSERT_USER, (error, results, fields) => {
								conn.release();
								if (error) throw error;
								logger.debug('beforeEach done');
								done();
							});
						}
					);
				}
			);
		});
	});

	it('TC-101-1 Valid login credentials', (done) => {
		const loginData = {
			emailAddress: "johndoe@example.com",
			password: "secret"
		};

		chai.request(server)
			.post(`/api/login`)
			.send(loginData)
			.end((err, res) => {
				res.should.be.an('object');
				const { status, result } = res.body;
				// Verify that the response status and result object are correct
				expect(status).to.equal(200);
				expect(result).to.be.an('object');
				expect(result.token).to.be.a('string');
				expect(result.user).to.be.an('object');
				expect(result.user.id).to.equal(1);
				expect(result.user.firstName).to.equal('John');
				expect(result.user.lastName).to.equal('Doe');
				expect(result.user.emailAddress).to.equal('johndoe@example.com');
				expect(result.user.phoneNumber).to.equal('123456789');
				expect(result.user.street).to.equal('123 Street');
				expect(result.user.city).to.equal('City');
				done();
			});
	});

	it('TC-101-2 Incomplete login credentials', (done) => {
		const loginData = {
			emailAddress: "johndoe@example.com"
		};

		chai.request(server)
			.post(`/api/login`)
			.send(loginData)
			.end((err, res) => {
				res.should.be.an('object');
				const { status, message } = res.body;
				// Verify that the response status and error message are correct
				expect(status).to.equal(400);
				expect(message).to.equal('emailAdress and password are required');
				done();
			});
	});

	it('TC-101-3 Invalid login credentials', (done) => {
		const loginData = {
			emailAddress: "johndoe@example.com",
			password: "wrongpassword"
		};

		chai.request(server)
			.post(`/api/login`)
			.send(loginData)
			.end((err, res) => {
				res.should.be.an('object');
				const { status, message } = res.body;
				// Verify that the response status and error message are correct
				expect(status).to.equal(401);
				expect(message).to.equal('Invalid email address or password');
				done();
			});
	});

	it('TC-101-4 User not found', (done) => {
		const loginData = {
			emailAddress: "nonexistent@example.com",
			password: "Password123"
		};

		chai.request(server)
			.post(`/api/login`)
			.send(loginData)
			.end((err, res) => {
				res.should.be.an('object');
				const { status, message } = res.body;
				// Verify that the response status and error message are correct
				expect(status).to.equal(404);
				expect(message).to.equal('Invalid email address or password');
				done();
			});
	});
});
