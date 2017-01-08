const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const shuffle = require('../utils/shuffle');

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
        examsCollection.find({
            examCode: {$regex: query, $options: 'i'}
        }).toArray().then(result => {
            res.status(200).send(result);
        }).catch(next);
    });

    app.get('/:id', (req, res, next) => {
        examsCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
        }).toArray()
            .then(exams => {
                if (!exams.length) {
                    return next({status: 400, message: 'Exam not found'})
                }
                let exam = exams[0];
                let numOfTasks = (Object.keys(exam.categoryMap)).map(el => exam.categoryMap[el]).reduce((prev, curr, ind, arr) => { return prev + curr }, 0);
                let {_id, name, timeLimited, duration} = exam;

                res.status(200).send({_id, name, timeLimited, duration, numOfTasks});

            })
            .catch(next);
    });


    app.post('/:id', (req, res, next) => {

        let user = req.user;

        examsCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
        }).toArray().then(result => {

            let exam = result[0];

            let catIds = Object.keys(exam.categoryMap).map(val => new ObjectId(val))

            categoriesCollection.find({
                _id: {$in: catIds}
            }).toArray().then(results => {

                let tasks = [];

                results.forEach(val => {
                    (shuffle(val.tasks).slice(0, exam.categoryMap[val._id])).forEach(el => tasks.push(el))
                });

                let attempt = {};
                let present = Date.now();
                attempt.examId = new ObjectId(req.params.id);
                attempt.dateStarted = present;
                attempt.user = user;
                attempt.user._id = new ObjectId(user._id);
                attempt.duration = exam.duration;
                attempt.lastUpdate = present;
                attempt.tasks = tasks;
                attempt.results = [];
                attempt.name = exam.name
                attempt.finished = false;

                attemptsCollection.insertOne(attempt)
                    .then(mongoRes => {
                        attempt.tasks = tasks.map(({taskId, name, description, forbiddenWords, requiredWords, engineDB}) => ({
                            taskId,
                            name,
                            description,
                            forbiddenWords,
                            requiredWords,
                            engineDB
                        }));
                        res.status(200).send(attempt)
                    })
                    .catch(next);
            })

        })

    });

    return app;
};
