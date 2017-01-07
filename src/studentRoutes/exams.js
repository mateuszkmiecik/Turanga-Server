const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const request = require('request');

module.exports = (mongoClient) => {
    let app = express();

    let examsCollection = mongoClient.collection('exams');
    let categoriesCollection = mongoClient.collection('categories');
    let attemptsCollection = mongoClient.collection('attempts');

    app.post('/search', (req, res, next) => {
        if (!req.body) {
            return next({
                status: 400,
                message: 'No body sent'
            })
        }
        let {query} = req.body;
        examCollection.find({
            examCode: {$regex: query, $options: 'i'}
        }).toArray().then(result => {
            res.status(200).send(result);
        }).catch(next);
    });


    app.post('/exams/:id', (req, res, next) => {

        let user = req.user

        examsCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
        }).toArray().then(result => {

            let exam = result[0];

            let catIds = Object.keys(exam.categoryMap).map(val => new ObjectId(val))

            categoriesCollection.find({
                _id: {$in: catIds}
            }).toArray().then(results => {

                let tasks = []

                results.forEach(val => {
                    (shuffle(val.tasks).slice(0, exam.categoryMap[val._id])).forEach(el => tasks.push(el))
                })

                let attempt = {}
                let present = Date.now()
                attempt.examId = new ObjectId(req.params.id)
                attempt.dateStarted = present
                attempt.user = user
                attempt.duration = exam.duration
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

        })

    });

    function shuffle(array) {
        let counter = array.length;

        while (counter > 0) {
            let index = Math.floor(Math.random() * counter);

            counter--;

            let temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }

        return array;
    }

    return app;
};
