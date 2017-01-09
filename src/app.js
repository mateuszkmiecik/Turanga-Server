const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const request = require('request')
const fs = require('fs')

const authMiddleware = require('./middlewares/auth-middleware');
const USER_ROLES = require('./constants').USER_ROLES;

const uploadsDir = path.resolve(__dirname, '..', 'uploads');

const multiparty = require('connect-multiparty');
const multipartyMiddleware = multiparty({
    uploadDir: uploadsDir
})

module.exports = (mongoClient) => {
    const app = express();

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(cookieParser());
    app.use(cors());

    app.use('/static', express.static('uploads'))

    app.get('/', (req, res) => {
        res.status(200).send({name: 'Turanga Server'})
    });

    app.use('/api/auth', require('./routes/auth')(mongoClient));

    app.use(authMiddleware);

    app.use('/api/student/attempts', require('./studentRoutes/attempts')(mongoClient));
    app.use('/api/student/exams', require('./studentRoutes/exams')(mongoClient));
    app.use('/api/student/categories', require('./studentRoutes/categories')(mongoClient));


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


    app.use(authMiddleware.withStatus({allowedRoles: [USER_ROLES.ADMIN]}));

    app.get('/api/dbCodes', (req, res, next) => {
        let options = {
            method: 'get',
            url: 'http://localhost:8081/dbs'
        };
        request.get(options, (err, resp) => {
            let dbs = resp.body;
            dbs = JSON.parse(dbs).map(el => { return {code : el}});
            res.status(200).send(dbs);
        });
    });

    app.use('/api/users',  require('./routes/users')(mongoClient.collection('users')));
    app.use('/api/groups', require('./routes/groups')(mongoClient));
    app.use('/api/databases', require('./routes/databases')(mongoClient.collection('databases')));

    app.use('/api/categories', require('./routes/categories')(mongoClient.collection('categories')));
    app.use('/api/exams', require('./routes/exams')(mongoClient.collection('exams')));
    app.use('/api/attempts', require('./routes/attempts')(mongoClient));


    app.post('/api/upload', multipartyMiddleware, (req, res, next) => {
        Promise.all(req.files.files.map(file => new Promise((resolve, reject) => {
            let targetPath = path.resolve(uploadsDir, file.originalFilename);
            fs.rename(file.path, targetPath, function (err) {
                if (err) reject(err);
                else resolve(file.originalFilename);
            });
        }))).then((file) => {
            res.status(200).send({message: 'Upload completed', filename: file[0]})
        }).catch(next);
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
