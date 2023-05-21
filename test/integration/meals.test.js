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
const pool = require('../../src/util/mysql-db');

chai.should();
chai.use(chaiHttp);

// Clearing queries
const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM `meal`;';
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;';
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM `user`;';
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

// INSERT USER
const INSERT_USER = `INSERT INTO 'user' ('id', 'firstName', 'lastName', 'emailAdress', 'password', 'phoneNumber', 'street', 'city') VALUES 
(1, 'John', 'Doe', 'johndoe@example.com', 'Password1!', '123456789', '123 Street', 'City');`;
const INSERT_USER2 = `INSERT INTO 'user' ('id', 'firstName', 'lastName', 'emailAdress', 'password', 'phoneNumber', 'street', 'city') VALUES 
(2, 'Jane', 'Smith', 'janesmith@example.com', 'Password2!', '987654321', '456 Street', 'City');`;

// INSERT MEAL
const INSERT_MEAL = `INSERT INTO meal (id, isActive, isVega, isVegan, isToTakeHome, dateTime, maxAmountOfParticipants, price, imageUrl, cookId, name, description) VALUES 
(1, 1, 1, 1, 1, '2022-05-20 06:36:27', 6, 6.75, 'https://example.com/image1.jpg', 1, 'Spaghetti Bolognese', 'The ultimate pasta classic.');`;
const INSERT_MEAL2 = `INSERT INTO meal (id, isActive, isVega, isVegan, isToTakeHome, dateTime, maxAmountOfParticipants, price, imageUrl, cookId, name, description) VALUES 
(2, 0, 0, 0, 0, '2022-06-20 06:36:27', 7, 7.75, 'https://example.com/image2.jpg', 2, 'Lasagna', 'Layers of deliciousness.');`;

// INSERT PARTICIPATION
const INSERT_PARTICIPATION = `INSERT INTO meal_participants_user (mealId, userId) VALUES (1, 1);`;


describe('CRUD Meals /api/meal', () => {
	describe('UC-301 Register Meal', () => {

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
                const { status, message } = res.body;
                // Verify that the response status and error message are correct
                expect(status).to.equal(400);
                expect(message).to.equal('description must be a string');
                done();
            });
        });
	});
});