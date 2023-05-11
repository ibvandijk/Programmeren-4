// process.env['DB_DATABASE'] = process.env.DB_DATABASE || 'shareameal-testdb';

// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const server = require('../../app');
// const assert = require('assert');
// const dbconnection = require('../../src/util/mysql-db');
// const jwt = require('jsonwebtoken');
// const { jwtSecretKey, logger } = require('../../src/util/utils');
// require('tracer').setLevel('trace');

// chai.should();
// chai.use(chaiHttp);

// /**
//  * Db queries to clear and fill the test database before each test.
//  *
//  * LET OP: om via de mysql2 package meerdere queries in één keer uit te kunnen voeren,
//  * moet je de optie 'multipleStatements: true' in de database config hebben staan.
//  */
// const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM `meal`;';
// const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;';
// const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM `user`;';
// const CLEAR_DB =
//   CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

// /**
//  * Voeg een user toe aan de database. Deze user heeft id 1.
//  * Deze id kun je als foreign key gebruiken in de andere queries, bv insert meal.
//  */
// const INSERT_USER =
//   'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
//   '(1, "first", "last", "name@server.nl", "secret", "street", "city");';

// /**
//  * Query om twee meals toe te voegen. Let op de cookId, die moet matchen
//  * met een bestaande user in de database.
//  */
// const INSERT_MEALS =
//   'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
//   "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
//   "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1);";

// describe('Users API', () => {
//   //
//   // informatie over before, after, beforeEach, afterEach:
//   // https://mochajs.org/#hooks
//   //
//   before((done) => {
//     logger.trace(
//       'before: hier zorg je eventueel dat de precondities correct zijn'
//     );
//     logger.trace('before done');
//     done();
//   });

//   describe('UC-xyz [usecase beschrijving]', () => {
//     //
//     beforeEach((done) => {
//       logger.trace('beforeEach called');
//       // maak de testdatabase leeg zodat we onze testen kunnen uitvoeren.
//       dbconnection.getConnection(function (err, connection) {
//         if (err) {
//           done(err);
//           throw err; // no connection
//         }
//         // Use the connection
//         connection.query(
//           CLEAR_DB + INSERT_USER,
//           function (error, results, fields) {
//             if (error) {
//               done(error);
//               throw error; // not connected!
//             }
//             logger.trace('beforeEach done');
//             // When done with the connection, release it.
//             dbconnection.releaseConnection(connection);
//             // Let op dat je done() pas aanroept als de query callback eindigt!
//             done();
//           }
//         );
//       });
//     });
//   });

//   describe('UC-203 Opvragen van gebruikersprofiel', () => {
//     //
//     beforeEach((done) => {
//       logger.trace('beforeEach called');
//       // maak de testdatabase leeg zodat we onze testen kunnen uitvoeren.
//       dbconnection.getConnection(function (err, connection) {
//         if (err) {
//           done(err);
//           throw err; // no connection
//         }
//         // Use the connection
//         connection.query(
//           CLEAR_DB + INSERT_USER,
//           function (error, results, fields) {
//             if (error) {
//               done(error);
//               throw error; // not connected!
//             }
//             logger.trace('beforeEach done');
//             // When done with the connection, release it.
//             dbconnection.releaseConnection(connection);
//             // Let op dat je done() pas aanroept als de query callback eindigt!
//             done();
//           }
//         );
//       });
//     });

//     it.skip('TC-203-1 Ongeldig token', (done) => {
//       chai
//         .request(server)
//         .get('/api/user/profile')
//         .set('authorization', 'Bearer hier-staat-een-ongeldig-token')
//         .end((err, res) => {
//           assert.ifError(err);
//           res.should.have.status(401);
//           res.should.be.an('object');

//           res.body.should.be
//             .an('object')
//             .that.has.all.keys('code', 'message', 'data');
//           let { code, message, data } = res.body;
//           code.should.be.an('number');
//           message.should.be.a('string').equal('Not authorized');
//           done();
//         });
//     });

//     it('TC-203-2 Gebruiker ingelogd met geldig token', (done) => {
//       // Gebruiker met id = 1 is toegevoegd in de testdatabase. We zouden nu
//       // in deze testcase succesvol het profiel van die gebruiker moeten vinden
//       // als we een valide token meesturen.
//       chai
//         .request(server)
//         .get('/api/user/profile')
//         .set('authorization', 'Bearer ' + jwt.sign({ userId: 1 }, jwtSecretKey))
//         .end((err, res) => {
//           assert.ifError(err);
//           res.should.have.status(200);
//           res.should.be.an('object');
//           res.body.should.be.an('object')
//             .that.has.all.keys('code', 'message', 'data');
//           let { code, message, data } = res.body;
//           code.should.be.an('number');
//           message.should.be.a('string')
//             .that.contains('Get User profile');
//           data.should.be.an('object');
//           data.id.should.equal(1);
//           data.firstName.should.equal('first');
//           done();
//         });
//     });
//   });
// });
