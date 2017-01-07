const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const request = require('request');
const shuffle = require('../utils/shuffle');

module.exports = (mongoClient) => {
    let app = express();

    let categoriesCollection = mongoClient.collection('categories');
    let attemptsCollection = mongoClient.collection('attempts');

    app.get('/', (req, res, next) => {
        categoriesCollection.find({
            deleted: null
        }).toArray()
            .then(users => {
                res.status(200).send(users);
            })
            .catch(next);
    });

    app.post('/:id', (req, res, next) => {

        let user = req.user

        categoriesCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
        }).toArray().then(results => {

            let tasks = []

            results.forEach(val => {
                (shuffle(val.tasks).slice(0, val.tasks.length)).forEach(el => tasks.push(el))
            })

            let attempt = {}
            let present = Date.now()
            attempt.catId = new ObjectId(req.params.id)
            attempt.dateStarted = present
            attempt.user = user
            attempt.lastUpdate = present
            attempt.tasks = tasks
            attempt.results = []

            attemptsCollection.insertOne(attempt)
                .then(mongoRes => {
                    attempt.tasks = tasks.map(({taskId, name, description}) => ({taskId, name, description}))
                    res.status(200).send(attempt)
                })
                .catch(next);
        })

    });

    return app;
};
