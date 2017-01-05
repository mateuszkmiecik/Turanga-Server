const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const request = require('request')

const restEndpoints = require('./helpers/restEndpoints');
const authMiddleware = require('./middlewares/auth-middleware');
const USER_ROLES = require('./constants').USER_ROLES;

const multiparty = require('connect-multiparty');
const multipartyMidldleware = multiparty({
    uploadDir: path.resolve(__dirname, '..', 'uploads')
})

module.exports = (mongoClient) => {
    const app = express();

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(cookieParser());
    app.use(cors());

    app.get('/', (req, res) => {
        res.status(200).send({name: 'Turanga Server'})
    });

    app.use('/api/auth', require('./routes/auth')(mongoClient));

    app.use(authMiddleware);

    app.use('/api/student', require('./studentRoutes')(mongoClient));

    app.use('/api/users', authMiddleware.withStatus({allowedRoles: [USER_ROLES.ADMIN]}),  require('./routes/users')(mongoClient.collection('users')));
    app.use('/api/groups', authMiddleware.withStatus({allowedRoles: [USER_ROLES.ADMIN]}), require('./routes/groups')(mongoClient.collection('groups')));
    app.use('/api/databases', authMiddleware.withStatus({allowedRoles: [USER_ROLES.ADMIN]}), restEndpoints(mongoClient.collection('databases')));

    app.use('/api/categories', require('./routes/categories')(mongoClient.collection('categories')));
    app.use('/api/results', restEndpoints(mongoClient.collection('results')));
    app.use('/api/exams', require('./routes/exams')(mongoClient.collection('exams')));
    app.use('/api/attempts', require('./routes/attempts')(mongoClient));

    app.post('/api/upload', multipartyMidldleware, (req, res, next) => {
        console.log(req.files)
        res.status(200).end('Upload completed')
    })

    app.post('/api/query', (req, res, next) => {
        if(!req.body){
            return res.status(400).send({message: 'Bad Request'});
        }
        let options = {
            method: 'post',
            body: req.body,
            json: true,
            url: 'http://localhost:8081/query'
        };
        request.post(options).pipe(res);
    });

    app.get('/api/dbs', (req, res, next) => {
        let options = {
            method: 'get',
            url: 'http://localhost:8081/dbs'
        };
        request.get(options).pipe(res);
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
