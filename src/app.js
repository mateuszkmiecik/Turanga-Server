const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

module.exports = (mongoClient) => {
    const app = express();

    const restEndpoints = require('./helpers/restEndpoints')

    const categoriesRoute = require('./routes/categories');

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(cookieParser());
    app.use(cors());

    app.get('/', (req, res) => {
        res.status(200).send({name: 'Turanga Server'})
    });

    app.use('/api/auth', require('./routes/auth')(mongoClient));

    app.use('/api/users', restEndpoints(mongoClient.collection('users')));
    app.use('/api/categories', categoriesRoute(mongoClient.collection('categories')));
    app.use('/api/tasks', restEndpoints(mongoClient.collection('tasks')));
    app.use('/api/databases', restEndpoints(mongoClient.collection('databases')));

    app.post('/api/query', (req, res, next) => {
        res.status(200).send({
  "correct": Math.random() > 0.5,
  "results": [{
      "ACTOR_ID": "1",
      "LAST_UPDATE": "2013-05-26 14:47:57.62",
      "LAST_NAME": "Guiness",
      "FIRST_NAME": "Penelope"
    }],
  "errorMessage": ""
});
    });

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handler
    app.use((err, req, res, next) => {
        console.log(err.message);
        res.status(err.status || 500).send({message: err.message});
    });

    return app;
}
