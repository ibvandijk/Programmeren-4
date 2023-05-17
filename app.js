const express = require('express');
const logger = require('./src/util/utils').logger;

const app = express();
const port = process.env.PORT || 3000;


app.use('*', (req, res, next) => {
  const method = req.method;
  logger.trace(`Methode ${method} is aangeroepen`);
  next();
});

// References to the routes;
const userRoutes = require('./src/routes/user.routes');
app.use('/api/user', userRoutes);

// UC-101 inloggen
const userController = require('./src/controllers/user.controller.js');
app.post('/api/login', userController.loginUser);

// UC-102 Opvragen van systeeminformatie
app.get('/api/info', (req, res) => {
  logger.info('Get server information');
  res.status(201).json({
    status: 201,
    message: 'Server-info endpoint',
    data: {
      studentName: 'Ivan van DIjk',
      studentNumber: 2196154,
      description: 'This is my express server for the class Porgamming-4'
    }
  });
});

// invalid URL, catch all solution
app.use('*', (req, res) => {
  logger.warn('Invalid endpoint called: ', req.path);
  res.status(404).json({
    status: 404,
    message: 'Endpoint not found',
    data: {}
  });
});

// Express error handler
app.use((err, req, res, next) => {
  logger.error(err.code, err.message);
  res.status(err.code).json({
    statusCode: err.code,
    message: err.message,
    data: {}
  });
});

// Start the server
app.listen(port, () => {
  logger.info(`Server started on port ${port}`);
});

module.exports = app;
