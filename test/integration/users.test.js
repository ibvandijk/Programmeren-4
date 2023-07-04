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
const { log } = require('console');
const expect = chai.expect;

chai.should();
chai.use(chaiHttp);

// Clearing queries
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM user;';
const INSERT_USER =
	'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `phoneNumber`, `street`, `city` ) VALUES' +
	'(99, "first", "last", "name@server.nl", "Password1!", "0000000000", "street", "city");';
const INSERT_USER2 =
	'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `phoneNumber`, `street`, `city` ) VALUES' +
	'(100, "second", "secondlast", "secondname@server.nl", "Password1!", "0000000000", "secondstreet", "secondcity");';


describe('User Tests', () => {

  // UC-201 Registreren
  describe('UC-201 Registreren', () => {
    beforeEach((done) => {
      logger.debug('beforeEach called');
      pool.getConnection(function (err, conn) {
        if (err) throw err;
        conn.query(
          'ALTER TABLE `user` AUTO_INCREMENT = 1;',
          function (error, result, fields) {
            conn.query(
              CLEAR_USERS_TABLE,
              function (error, results, fields) {
                conn.release();
                if (error) throw error;
                logger.debug('beforeEach done');
                done();
              }
            );
          }
        );
      });
    });

    it('TC-201-1 Verplicht veld ontbreekt', (done) => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        password: 'Password1!',
        phoneNumber: '123456789',
        street: '123 Street',
        city: 'City'
      };

      chai.request(server)
        .post('/api/user')
        .send(userData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          expect(status).to.equal(400);
          expect(message).to.equal('Missing field: emailAdress');
          done();
        });
    });

    it('TC-201-2 Niet-valide emailadres', (done) => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        emailAdress: 'johndoexample.com',
        password: 'Password1!',
        phoneNumber: '123456789',
        street: '123 Street',
        city: 'City'
      };

      chai.request(server)
        .post('/api/user')
        .send(userData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(400);
          expect(message).to.equal('emailAdress is not valid');
          done();
        });
    });

    it('TC-201-3 Niet-valide wachtwoord', (done) => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        emailAdress: 'johndoe@example.com',
        password: 'password1',
        phoneNumber: '123456789',
        street: '123 Street',
        city: 'City'
      };

      chai.request(server)
        .post('/api/user')
        .send(userData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(400);
          expect(message).to.equal('password is not valid');
          done();
        });
    });

    it('TC-201-4 Gebruiker bestaat al', (done) => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        emailAdress: 'johndoe@example.com',
        password: 'Password1!',
        phoneNumber: '1234567891',
        street: '123 Street',
        city: 'City'
      };

      chai.request(server)
        .post('/api/user')
        .send(userData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(403);
          expect(message).to.equal(`The email address: ${userData.emailAdress} has already been taken!`);
          done();
        });
    });

    it('TC-201-5 Gebruiker succesvol geregistreerd', (done) => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        emailAdress: 'johndoe@test.com',
        password: 'Password1!',
        phoneNumber: '1234567891',
        street: '123 Street',
        city: 'City'
      };

      chai.request(server)
        .post('/api/user')
        .send(userData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message, result } = res.body;

          expect(status).to.equal(201);
          expect(message).to.equal('User successfully registered');
          expect(result).to.be.an('object');
          expect(result.firstName).to.equal(userData.firstName);
          expect(result.lastName).to.equal(userData.lastName);
          expect(result.emailAdress).to.equal(userData.emailAdress);
          expect(result.phoneNumber).to.equal(userData.phoneNumber);
          expect(result.street).to.equal(userData.street);
          expect(result.city).to.equal(userData.city);
          done();
        });
    });
  });
  // ------ UC-201 Registreren -----

  // UC-202 Opvragen van overzicht van users
  describe('UC-202 Opvragen van overzicht van users', () => {
    beforeEach((done) => {
      logger.debug('beforeEach called');
      pool.getConnection(function (err, conn) {
        if (err) throw err;
        conn.query(
          'ALTER TABLE `user` AUTO_INCREMENT = 1;',
          function (error, result, fields) {
            conn.query(
              CLEAR_USERS_TABLE + INSERT_USER + INSERT_USER2,
              function (error, results, fields) {
                conn.release();
                if (error) throw error;
                logger.debug('beforeEach done');
                done();
              }
            );
          }
        );
      });
    });

    it('TC-202-1 Toon alle gebruikers (minimaal 2)', (done) => {
      chai.request(server)
        .get('/api/user')
        .set(
            'authorization',
            'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
        )
        .end((err, res) => {
            res.should.be.an('object');
            let { status, message, data } = res.body;
            // Verify that the response status, message, and data are correct
            expect(status).to.equal(200);
            expect(message).to.equal('Users retrieved successfully');
            expect(data).to.be.an('array');
            expect(data.length).to.be.at.least(2);
            done();
        });
    });

    it('TC-202-2 Toon gebruikers met zoekterm isActive', (done) => {
      const searchTerm = 'isActive';
      const searchField = '0';

      chai.request(server)
        .get(`/api/user?${searchTerm}=${searchField}`)
        .set(
            'authorization',
            'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
        )
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message, data } = res.body;
          // Verify that the response status, message, and data are correct
          expect(status).to.equal(200);
          expect(message).to.equal('Users retrieved successfully');
          expect(data).to.be.an('array');
          expect(data.length).to.equal(0);
          done();
        });
    });

    it('TC-202-3 Toon gebruikers met gebruik van de zoekterm op het veld "isActive"=false', (done) => {
      const searchTerm = 'isActive=false';

      chai.request(server)
        .get(`/api/user?search=${searchTerm}`)
        .set(
            'authorization',
            'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
        )
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message, data } = res.body;
          // Verify that the response status, message, and data are correct
          expect(status).to.equal(200);
          expect(message).to.equal('Users retrieved successfully');
          expect(data).to.be.an('array');
          // Assuming there are no inactive users in the database
          expect(data.length).to.equal(3);
          done();
        });
    });

    it('TC-202-4 Toon gebruikers met gebruik van de zoekterm op het veld "isActive"=true', (done) => {
      const searchTerm = 'isActive:true';

      chai.request(server)
        .get(`/api/user?search=${searchTerm}`)
        .set(
            'authorization',
            'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
        )
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message, data } = res.body;
          // Verify that the response status, message, and data are correct
          expect(status).to.equal(200);
          expect(message).to.equal('Users retrieved successfully');
          expect(data).to.be.an('array');
          // Assuming there are no active users in the database
          expect(data.length).to.equal(3);
          done();
        });
    });

    it('TC-202-5 Toon gebruikers met zoektermen op bestaande velden (max op 2 velden filteren)', (done) => {
      const searchTerm1 = 'firstName=John';
      const searchTerm2 = 'lastName=Doe';

      chai.request(server)
        .get(`/api/user?${searchTerm1}&${searchTerm2}`)
        .set(
                'authorization',
                'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
            )
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message, data } = res.body;
          // Verify that the response status, message, and data are correct
          expect(status).to.equal(200);
          expect(message).to.equal('Users retrieved successfully');
          expect(data).to.be.an('array');
          expect(data.length).to.be.at.least(1);
          done();
        });
    });
  });
  // ------ UC-202 Opvragen van overzicht van users -----

  // UC-203 Opvragen van gebruikersprofiel
  describe('UC-203 Opvragen van gebruikersprofiel', () => {
    let token = jwt.sign({ userId: 99 }, jwtSecretKey);

    beforeEach((done) => {
        logger.debug('beforeEach called');
        pool.getConnection(function (err, conn) {
          if (err) throw err;
          conn.query(
            'ALTER TABLE `user` AUTO_INCREMENT = 1;',
            function (error, result, fields) {
              conn.query(
                CLEAR_USERS_TABLE + INSERT_USER + INSERT_USER2,
                function (error, results, fields) {
                  conn.release();
                  if (error) throw error;
                  logger.debug('beforeEach done');
                  done();
                }
              );
            }
          );
        });
      });

    it('TC-203-1 Ongeldig token', (done) => {
      chai.request(server)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(401);
          expect(message).to.equal('Not authorized');
          done();
        });
    });

    it('TC-203-2 Gebruiker is ingelogd met geldig token', (done) => {
      chai.request(server)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message, data } = res.body;
          // Verify that the response status, message, and data are correct
          expect(status).to.equal(200);
          expect(message).to.equal('User profile retrieved successfully');
          expect(data).to.be.an('object');
          expect(data.firstName).to.equal('first');
          expect(data.lastName).to.equal('last');
          expect(data.emailAdress).to.equal('name@server.nl');
          expect(data.phoneNumber).to.equal('0000000000');
          expect(data.street).to.equal('street');
          expect(data.city).to.equal('city');
          done();
        });
    });
  });
  // ----- UC-203 Opvragen van gebruikersprofiel -----

  // UC-204 Opvragen van usergegevens bij ID
  describe('UC-204 Opvragen van usergegevens bij ID', () => {
    let token = jwt.sign({ userId: 99 }, jwtSecretKey);

    beforeEach((done) => {
        logger.debug('beforeEach called');
        pool.getConnection(function (err, conn) {
          if (err) throw err;
          conn.query(
            'ALTER TABLE `user` AUTO_INCREMENT = 1;',
            function (error, result, fields) {
              conn.query(
                CLEAR_USERS_TABLE + INSERT_USER + INSERT_USER2,
                function (error, results, fields) {
                  conn.release();
                  if (error) throw error;
                  logger.debug('beforeEach done');
                  done();
                }
              );
            }
          );
        });
      });

    it('TC-204-1 Ongeldig token', (done) => {
      const userId = 1;

      chai.request(server)
        .get(`/api/user/${userId}`)
        .set('Authorization', 'Bearer invalidtoken')
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(401);
          expect(message).to.equal('Not authorized');
          done();
        });
    });

    it('TC-204-2 Gebruiker-ID bestaat niet', (done) => {
      const userId = 999;

      chai.request(server)
        .get(`/api/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(404);
          expect(message).to.equal('User not found');
          done();
        });
    });

    it('TC-204-3 Gebruiker-ID bestaat', (done) => {
      const userId = 99;

      chai.request(server)
        .get(`/api/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message, data } = res.body;
          // Verify that the response status, message, and data are correct
          expect(status).to.equal(200);
          expect(message).to.equal('User profile retrieved successfully');
          expect(data).to.be.an('object');
          expect(data.firstName).to.equal('first');
          expect(data.lastName).to.equal('last');
          expect(data.emailAdress).to.equal('name@server.nl');
          expect(data.phoneNumber).to.equal('0000000000');
          expect(data.street).to.equal('street');
          expect(data.city).to.equal('city');
          done();
        });
    });
  });
  // ----- UC-204 Opvragen van usergegevens bij ID -----

  // UC-205 Updaten van usergegevens
  describe('UC-205 Updaten van usergegevens', () => {
    let token = jwt.sign({ userId: 99 }, jwtSecretKey);

    beforeEach((done) => {
        logger.debug('beforeEach called');
        pool.getConnection(function (err, conn) {
          if (err) throw err;
          conn.query(
            'ALTER TABLE `user` AUTO_INCREMENT = 1;',
            function (error, result, fields) {
              conn.query(
                CLEAR_USERS_TABLE + INSERT_USER + INSERT_USER2,
                function (error, results, fields) {
                  conn.release();
                  if (error) throw error;
                  logger.debug('beforeEach done');
                  done();
                }
              );
            }
          );
        });
      });

    it('TC-205-1 Verplicht veld "emailAdress" ontbreekt', (done) => {
      const userId = 99;
      const updatedUserData = {
        firstName: 'John',
        lastName: 'Doe',
        password: 'Password2!',
        phoneNumber: '987654321',
        street: '456 Street',
        city: 'Town'
      };

      chai.request(server)
        .put(`/api/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedUserData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(400);
          expect(message).to.equal('Missing field: emailAdress');
          done();
        });
    });

    it('TC-205-2 De gebruiker is niet de eigenaar van de data', (done) => {
      const userId = 999;
      const updatedUserData = {
        firstName: 'John',
        lastName: 'Doe',
        emailAdress: 'johndoe@example.com',
        password: 'Password2!',
        phoneNumber: '1987654321',
        street: '456 Street',
        city: 'Town'
      };

      chai.request(server)
        .put(`/api/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedUserData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(403);
          expect(message).to.equal('Forbidden: You are not the owner of this user');
          done();
        });
    });

    it('TC-205-3 Niet-valide telefoonnummer', (done) => {
      const userId = 1;
      const updatedUserData = {
        firstName: 'John',
        lastName: 'Doe',
        emailAdress: 'johndoe@example.com',
        password: 'Password2!',
        phoneNumber: '123',
        street: '456 Street',
        city: 'Town'
      };

      chai.request(server)
        .put(`/api/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedUserData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(400);
          expect(message).to.equal('phoneNumber is not valid');
          done();
        });
    });

    it('TC-205-4 Gebruiker bestaat niet', (done) => {
      const userId = 999;
      const updatedUserData = {
        firstName: 'John',
        lastName: 'Doe',
        emailAdress: 'johndoe@example.com',
        password: 'Password2!',
        phoneNumber: '1987654321',
        street: '456 Street',
        city: 'Town'
      };

      chai.request(server)
        .put(`/api/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedUserData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(404);
          expect(message).to.equal('User not found');
          done();
        });
    });

    it('TC-205-5 Niet ingelogd', (done) => {
      const userId = 99;
      const updatedUserData = {
        firstName: 'John',
        lastName: 'Doe',
        emailAdress: 'johndoe@example.com',
        password: 'Password2!',
        phoneNumber: '1987654321',
        street: '456 Street',
        city: 'Town'
      };

      chai.request(server)
        .put(`/api/user/${userId}`)
        .send(updatedUserData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message } = res.body;
          // Verify that the response status and error message are correct
          expect(status).to.equal(401);
          expect(message).to.equal('Unauthorized: Missing or invalid token');
          done();
        });
    });

    it('TC-205-6 Gebruiker succesvol gewijzigd', (done) => {
      const userId = 99;
      const updatedUserData = {
        firstName: 'Jane',
        lastName: 'Doe',
        emailAdress: 'janedoe@example.com',
        password: 'Password2!',
        phoneNumber: '1987654321',
        street: '456 Street',
        city: 'Town'
      };

      chai.request(server)
        .put(`/api/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedUserData)
        .end((err, res) => {
          res.should.be.an('object');
          let { status, message, data } = res.body;
          // Verify that the response status, message, and data are correct
          expect(status).to.equal(200);
          expect(message).to.equal('User updated successfully');
          expect(data).to.be.an('object');
          expect(data.firstName).to.equal('Jane');
          expect(data.lastName).to.equal('Doe');
          expect(data.emailAdress).to.equal('janedoe@example.com');
          expect(data.phoneNumber).to.equal('987654321');
          expect(data.street).to.equal('456 Street');
          expect(data.city).to.equal('Town');
          done();
        });
    });
  });
  // ----- UC-205 Updaten van usergegevens -----

//   // UC-206 Verwijderen van user
//   describe('UC-206 Verwijderen van user', () => {
//     let token = '';

//     beforeEach((done) => {
//       logger.debug('beforeEach called');
//       pool.getConnection(function (err, conn) {
//         if (err) throw err;
//         conn.query(
//           'ALTER TABLE `user` AUTO_INCREMENT = 1;',
//           function (error, result, fields) {
//             conn.query(
//               CLEAR_USERS_TABLE,
//               function (error, results, fields) {
//                 // Create a user for testing
//                 const userData = {
//                   firstName: 'John',
//                   lastName: 'Doe',
//                   emailAdress: 'johndoe@example.com',
//                   password: 'Password1!',
//                   phoneNumber: '123456789',
//                   street: '123 Street',
//                   city: 'City'
//                 };

//                 userController.createUser(userData, (error, result) => {
//                   // Generate a token for the user
//                   token = jwt.sign({ userId: result.insertId }, jwtSecretKey);

//                   conn.release();
//                   if (error) throw error;
//                   logger.debug('beforeEach done');
//                   done();
//                 });
//               }
//             );
//           }
//         );
//       });
//     });

//     it('TC-206-1 Gebruiker bestaat niet', (done) => {
//       const userId = 999;

//       chai.request(server)
//         .delete(`/api/user/${userId}`)
//         .set('Authorization', `Bearer ${token}`)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and error message are correct
//           expect(status).to.equal(404);
//           expect(message).to.equal('User not found');
//           done();
//         });
//     });

//     it('TC-206-2 Gebruiker is niet ingelogd', (done) => {
//       const userId = 1;

//       chai.request(server)
//         .delete(`/api/user/${userId}`)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and error message are correct
//           expect(status).to.equal(401);
//           expect(message).to.equal('Unauthorized: Missing or invalid token');
//           done();
//         });
//     });

//     it('TC-206-3 De gebruiker is niet de eigenaar van de data', (done) => {
//       const userId = 1;

//       // Generate a token for a different user
//       const differentUserToken = jwt.sign({ userId: 999 }, jwtSecretKey);

//       chai.request(server)
//         .delete(`/api/user/${userId}`)
//         .set('Authorization', `Bearer ${differentUserToken}`)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and error message are correct
//           expect(status).to.equal(403);
//           expect(message).to.equal('Forbidden: You are not the owner of this user');
//           done();
//         });
//     });

//     it('TC-206-4 Gebruiker succesvol verwijderd', (done) => {
//       const userId = 1;

//       chai.request(server)
//         .delete(`/api/user/${userId}`)
//         .set('Authorization', `Bearer ${token}`)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and message are correct
//           expect(status).to.equal(200);
//           expect(message).to.equal('User deleted successfully');
//           done();
//         });
//     });
//   });
//   // ----- UC-206 Verwijderen van user -----
});
