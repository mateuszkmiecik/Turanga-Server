"use strict";

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const secretKey = require('../../config/config').secret;
const authMiddleware = require('../middlewares/auth-middleware');

module.exports = (mongoClient) => {
    let app = express();

    app.get('/', authMiddleware.withStatus(401), (req, res, next) => {
        res.status(200).send(req.user);
    });

    app.post('/', (req, res, next) => {
        let usersData = req.body;

        mongoClient.collection('users').find({username: usersData.username}).toArray()
            .then((foundUser) => {
                let userToAuthenticate = foundUser[0];

                if (!userToAuthenticate) {
                    return next({status: 401, message: 'Invalid username or/and password.'})
                }

                let md5 = crypto.createHash('md5');

                if (userToAuthenticate.password != md5.update(usersData.password).digest('hex')) {
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

    return app;

};