const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const USER_ROLES = require('../constants').USER_ROLES;

const secretKey = require('../../config/config').secret;
const authMiddleware = require('../middlewares/auth-middleware');

module.exports = (mongoClient) => {
    let app = express();

    app.get('/', authMiddleware.withStatus({status: 401}), (req, res, next) => {
        res.status(200).send(req.user);
    });

    app.post('/', (req, res, next) => {
        let usersData = req.body;

        mongoClient.collection('users').find({username: usersData.username, deleted : null}).toArray()
            .then((foundUser) => {
                let userToAuthenticate = foundUser[0];

                if (!userToAuthenticate) {
                    return next({status: 401, message: 'Invalid username or/and password.'})
                }

                let sha256 = crypto.createHash('sha256');

                if (userToAuthenticate.password != sha256.update(usersData.password).digest('hex')) {
                    return next({status: 401, message: 'Invalid username or/and password.'})
                }

                delete userToAuthenticate.password;

                let token = jwt.sign(userToAuthenticate, secretKey, {
                    expiresIn: '24h'
                });

                return res.status(200).send({
                    user: userToAuthenticate,
                    token: token
                });
            }).catch(next);

    });

    app.post('/register', (req, res, next) => {
        let usersData = req.body;

        if(!usersData.username || !usersData.password || !usersData.displayName){
            return next({
                status: 400,
                message: 'Provide username and password.'
            })
        }

        let sha256 = crypto.createHash('sha256');
        let hashedPassword = sha256.update(usersData.password).digest('hex');

        let newUsersData = {
            username: usersData.username,
            password: hashedPassword,
            name: usersData.displayName,
            role: 'USER'
        }

        mongoClient.collection('users').findOneAndUpdate(
            {username: newUsersData.username, deleted : null}, {
                $setOnInsert: newUsersData
            }, {upsert: true})
            .then(mongoRes => {
                if(!!mongoRes.value){
                    return res.status(409).send({message: 'User already exists.'})
                }
                res.status(201).send({
                    message: 'New user created.'
                });
            })
            .catch(next);

    })

    return app;

};