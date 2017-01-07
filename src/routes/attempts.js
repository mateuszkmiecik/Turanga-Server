const express = require('express');
const ObjectId = require('mongodb').ObjectId;


module.exports = (mongoClient) => {

    let app = express();

    let categoriesCollection = mongoClient.collection('categories');
    let examsCollection = mongoClient.collection('exams');
    let attemptsCollection = mongoClient.collection('attemps');

    app.get('/', (req, res, next) => {
        attemptsCollection.find({ deleted : null}).toArray()
            .then(attempts => {
                res.status(200).send(attempts);
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        attemptsCollection.find({
            _id: new ObjectId(req.params.id),
            deleted : null
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Attempt not found.'
                });
            }

            res.status(200).send(result[0]);
        })
    });

    return app;
};

