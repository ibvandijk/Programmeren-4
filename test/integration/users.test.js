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
const CLEAR_DB = CLEAR_USERS_TABLE;

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

    it('TC-202-1 Toon alle gebruikers (minimaal 2)', (done) => {
      // Insert two users into the database
      const usersData1 ={
          firstName: "John",
          lastName: "Doe",
          emailAdress: "johndoe@example.com",
          password: "Password1!",
          phoneNumber: "1234567891",
          street: "123 Street",
          city: "City"
        };
        const usersData2 ={
          firstName: "Jane",
          lastName: "Smith",
          emailAdress: "janesmith@example.com",
          password: "Password2!",
          phoneNumber: "1987654321",
          street: "456 Street",
          city: "Town"
        };

      userController.createUser(usersData1, () => {
        userController.createUser(usersData2, () => {
          chai.request(server)
            .get('/api/user')
            .set(
                'authorization',
                'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey)
            )
            .end((err, res) => {
              res.should.be.an('object');
              let { status, message, data } = res.body;
              logger.error("datareadout: ", data);
              // Verify that the response status, message, and data are correct
              expect(status).to.equal(200);
              expect(message).to.equal('Users retrieved successfully');
              expect(data).to.be.an('array');
              expect(data.length).to.be.at.least(2);
              done();
            });
        });
      });
    });

    it('TC-202-2 Toon gebruikers met zoekterm op niet-bestaande velden', (done) => {
      const searchTerm = 'invalidField';

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
          expect(data.length).to.equal(0);
          done();
        });
    });

    it('TC-202-3 Toon gebruikers met gebruik van de zoekterm op het veld "isActive"=false', (done) => {
      const searchTerm = 'isActive:false';

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
          expect(data.length).to.equal(0);
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
          expect(data.length).to.equal(0);
          done();
        });
    });

    it('TC-202-5 Toon gebruikers met zoektermen op bestaande velden (max op 2 velden filteren)', (done) => {
      const searchTerm1 = 'firstName:John';
      const searchTerm2 = 'lastName:Doe';

      chai.request(server)
        .get(`/api/user?search=${searchTerm1}&search=${searchTerm2}`)
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

//   // UC-203 Opvragen van gebruikersprofiel
//   describe('UC-203 Opvragen van gebruikersprofiel', () => {
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

//     it('TC-203-1 Ongeldig token', (done) => {
//       chai.request(server)
//         .get('/api/user/profile')
//         .set('Authorization', 'Bearer invalidtoken')
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and error message are correct
//           expect(status).to.equal(401);
//           expect(message).to.equal('Invalid token');
//           done();
//         });
//     });

//     it('TC-203-2 Gebruiker is ingelogd met geldig token', (done) => {
//       chai.request(server)
//         .get('/api/user/profile')
//         .set('Authorization', `Bearer ${token}`)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message, data } = res.body;
//           // Verify that the response status, message, and data are correct
//           expect(status).to.equal(200);
//           expect(message).to.equal('User profile retrieved successfully');
//           expect(data).to.be.an('object');
//           expect(data.firstName).to.equal('John');
//           expect(data.lastName).to.equal('Doe');
//           expect(data.emailAdress).to.equal('johndoe@example.com');
//           expect(data.phoneNumber).to.equal('123456789');
//           expect(data.street).to.equal('123 Street');
//           expect(data.city).to.equal('City');
//           done();
//         });
//     });
//   });
//   // ----- UC-203 Opvragen van gebruikersprofiel -----

//   // UC-204 Opvragen van usergegevens bij ID
//   describe('UC-204 Opvragen van usergegevens bij ID', () => {
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

//     it('TC-204-1 Ongeldig token', (done) => {
//       const userId = 1;

//       chai.request(server)
//         .get(`/api/user/${userId}`)
//         .set('Authorization', 'Bearer invalidtoken')
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and error message are correct
//           expect(status).to.equal(401);
//           expect(message).to.equal('Invalid token');
//           done();
//         });
//     });

//     it('TC-204-2 Gebruiker-ID bestaat niet', (done) => {
//       const userId = 999;

//       chai.request(server)
//         .get(`/api/user/${userId}`)
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

//     it('TC-204-3 Gebruiker-ID bestaat', (done) => {
//       const userId = 1;

//       chai.request(server)
//         .get(`/api/user/${userId}`)
//         .set('Authorization', `Bearer ${token}`)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message, data } = res.body;
//           // Verify that the response status, message, and data are correct
//           expect(status).to.equal(200);
//           expect(message).to.equal('User retrieved successfully');
//           expect(data).to.be.an('object');
//           expect(data.firstName).to.equal('John');
//           expect(data.lastName).to.equal('Doe');
//           expect(data.emailAdress).to.equal('johndoe@example.com');
//           expect(data.phoneNumber).to.equal('123456789');
//           expect(data.street).to.equal('123 Street');
//           expect(data.city).to.equal('City');
//           done();
//         });
//     });
//   });
//   // ----- UC-204 Opvragen van usergegevens bij ID -----

//   // UC-205 Updaten van usergegevens
//   describe('UC-205 Updaten van usergegevens', () => {
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

//     it('TC-205-1 Verplicht veld "emailAdress" ontbreekt', (done) => {
//       const userId = 1;
//       const updatedUserData = {
//         firstName: 'John',
//         lastName: 'Doe',
//         password: 'Password2!',
//         phoneNumber: '987654321',
//         street: '456 Street',
//         city: 'Town'
//       };

//       chai.request(server)
//         .put(`/api/user/${userId}`)
//         .set('Authorization', `Bearer ${token}`)
//         .send(updatedUserData)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and error message are correct
//           expect(status).to.equal(400);
//           expect(message).to.equal('Email address is required');
//           done();
//         });
//     });

//     it('TC-205-2 De gebruiker is niet de eigenaar van de data', (done) => {
//       const userId = 1;
//       const updatedUserData = {
//         firstName: 'John',
//         lastName: 'Doe',
//         emailAdress: 'johndoe@example.com',
//         password: 'Password2!',
//         phoneNumber: '987654321',
//         street: '456 Street',
//         city: 'Town'
//       };

//       // Generate a token for a different user
//       const differentUserToken = jwt.sign({ userId: 999 }, jwtSecretKey);

//       chai.request(server)
//         .put(`/api/user/${userId}`)
//         .set('Authorization', `Bearer ${differentUserToken}`)
//         .send(updatedUserData)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and error message are correct
//           expect(status).to.equal(403);
//           expect(message).to.equal('Forbidden: You are not the owner of this user');
//           done();
//         });
//     });

//     it('TC-205-3 Niet-valide telefoonnummer', (done) => {
//       const userId = 1;
//       const updatedUserData = {
//         firstName: 'John',
//         lastName: 'Doe',
//         emailAdress: 'johndoe@example.com',
//         password: 'Password2!',
//         phoneNumber: '123',
//         street: '456 Street',
//         city: 'Town'
//       };

//       chai.request(server)
//         .put(`/api/user/${userId}`)
//         .set('Authorization', `Bearer ${token}`)
//         .send(updatedUserData)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and error message are correct
//           expect(status).to.equal(400);
//           expect(message).to.equal('Phone number is not valid');
//           done();
//         });
//     });

//     it('TC-205-4 Gebruiker bestaat niet', (done) => {
//       const userId = 999;
//       const updatedUserData = {
//         firstName: 'John',
//         lastName: 'Doe',
//         emailAdress: 'johndoe@example.com',
//         password: 'Password2!',
//         phoneNumber: '987654321',
//         street: '456 Street',
//         city: 'Town'
//       };

//       chai.request(server)
//         .put(`/api/user/${userId}`)
//         .set('Authorization', `Bearer ${token}`)
//         .send(updatedUserData)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and error message are correct
//           expect(status).to.equal(404);
//           expect(message).to.equal('User not found');
//           done();
//         });
//     });

//     it('TC-205-5 Niet ingelogd', (done) => {
//       const userId = 1;
//       const updatedUserData = {
//         firstName: 'John',
//         lastName: 'Doe',
//         emailAdress: 'johndoe@example.com',
//         password: 'Password2!',
//         phoneNumber: '987654321',
//         street: '456 Street',
//         city: 'Town'
//       };

//       chai.request(server)
//         .put(`/api/user/${userId}`)
//         .send(updatedUserData)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message } = res.body;
//           // Verify that the response status and error message are correct
//           expect(status).to.equal(401);
//           expect(message).to.equal('Unauthorized: Missing or invalid token');
//           done();
//         });
//     });

//     it('TC-205-6 Gebruiker succesvol gewijzigd', (done) => {
//       const userId = 1;
//       const updatedUserData = {
//         firstName: 'Jane',
//         lastName: 'Doe',
//         emailAdress: 'janedoe@example.com',
//         password: 'Password2!',
//         phoneNumber: '987654321',
//         street: '456 Street',
//         city: 'Town'
//       };

//       chai.request(server)
//         .put(`/api/user/${userId}`)
//         .set('Authorization', `Bearer ${token}`)
//         .send(updatedUserData)
//         .end((err, res) => {
//           res.should.be.an('object');
//           let { status, message, data } = res.body;
//           // Verify that the response status, message, and data are correct
//           expect(status).to.equal(200);
//           expect(message).to.equal('User updated successfully');
//           expect(data).to.be.an('object');
//           expect(data.firstName).to.equal('Jane');
//           expect(data.lastName).to.equal('Doe');
//           expect(data.emailAdress).to.equal('janedoe@example.com');
//           expect(data.phoneNumber).to.equal('987654321');
//           expect(data.street).to.equal('456 Street');
//           expect(data.city).to.equal('Town');
//           done();
//         });
//     });
//   });
//   // ----- UC-205 Updaten van usergegevens -----

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
