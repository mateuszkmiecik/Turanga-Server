"use strict";

const express = require('express');
const ObjectId = require('mongodb').ObjectId;

module.exports = (mongoCollection) => {
    let app = express();

    app.get('/', (req, res, next) => {
        mongoCollection.find().toArray()
            .then(users => {
                res.status(200).send(users);
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        mongoCollection.find({
            _id: new ObjectId(req.params.id)
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'User not found.'
                });
            }

            res.status(200).send(result[0]);
        })
    });

    app.post('/', (req, res, next) => {
        let newCategory = req.body;
        mongoCollection.insertOne(newCategory)
            .then(mongoRes => {
                res.status(201).send(mongoRes);
            })
            .catch(next);
    });

    app.delete('/:id', (req, res, next) => {
        mongoCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        }).then(() => {
            res.status(200).end();
        }).catch(next);
    });

    return app;
};
