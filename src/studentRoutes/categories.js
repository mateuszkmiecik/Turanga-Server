const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const shuffle = require('../utils/shuffle');

module.exports = (mongoClient) => {
    let app = express();

    let categoriesCollection = mongoClient.collection('categories');
    let attemptsCollection = mongoClient.collection('attempts');

    app.get('/', (req, res, next) => {
        categoriesCollection.find({
            hidden: false,
            deleted: null
        }).toArray()
            .then(categories => {
                res.status(200).send(categories.filter(cat => cat.tasks && cat.tasks.length > 0).map(({_id, description, name, tasks}) => {
                    let category = {_id, description, name, exercisesNumber: 0};
                    if(!!tasks){
                        category.exercisesNumber = tasks.length;
                    }
                    return category;
                }));
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        categoriesCollection.find({
            _id: new ObjectId(req.params.id),
            hidden: false,
            deleted: null
        }).toArray()
            .then(categories => {
                if(!categories.length){
                    return next({status: 400, message: 'Category not found'})
                }
                let category = categories[0];
                let {_id, description, name} = category;

                attemptsCollection.find({
                    catId: category._id
                }).toArray().then(attempts => {
                    res.status(200).send({_id, description, name, attempts});
                })

            })
            .catch(next);
    });

    app.post('/:id', (req, res, next) => {

        let user = req.user;

        categoriesCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
        }).toArray().then(results => {

            if(!results.length){
                return next({
                    status: 404,
                    message: 'Category not found'
                })
            }

            let tasks = [];

            results.forEach(val => {
                (shuffle(val.tasks).slice(0, val.tasks.length)).forEach(el => tasks.push(el))
            });

            let attempt = {};
            let present = Date.now();
            attempt.catId = new ObjectId(req.params.id);
            attempt.dateStarted = present;

            user._id = new ObjectId(user._id);

            attempt.user = user;
            attempt.lastUpdate = present;
            attempt.tasks = tasks;
            attempt.results = [];
            attempt.name = results[0].name;

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
