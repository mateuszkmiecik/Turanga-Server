const express = require('express');
const ObjectId = require('mongodb').ObjectId;


module.exports = (mongoClient) => {

    let app = express();

    let categoriesCollection = mongoClient.collection('categories');
    let examsCollection = mongoClient.collection('exams');
    let attemptsCollection = mongoClient.collection('attemps');

    app.get('/', (req, res, next) => {
        attemptsCollection.find().toArray()
            .then(attempts => {
                res.status(200).send(attempts);
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        attemptsCollection.find({
            _id: new ObjectId(req.params.id)
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

    app.post('/:id', (req, res, next) => {

        let user = req.user

        examsCollection.find({
            _id: new ObjectId(req.params.id)
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

                attemptsCollection.insertOne(attempt)
                    .then(mongoRes => {
                        res.status(200).send(attempt)
                    })
                    .catch(next);
            })

        })

    });

    app.put('/:id', (req, res, next) => {
        let attempt = req.body;
        if (!attempt) {
            return next({
                status: 400,
                message: 'No attempt sent'
            })
        }

        let idToReplace = attempt._id;
        delete attempt._id;

        attemptsCollection.update({
            _id: new ObjectId(idToReplace)
        }, {$set: attempt}).then((result) => {
            return res.status(200).send({message: 'updated'});
        }).catch(next);
    });

    app.delete('/:id', (req, res, next) => {
        mongoCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        }).then(() => {
            res.status(200).end();
        }).catch(next);
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

