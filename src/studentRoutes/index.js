const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const request = require('request')

module.exports = (mongoClient) => {
    let app = express();

    let examsCollection = mongoClient.collection('exams');
    let categoriesCollection = mongoClient.collection('categories');
    let attemptsCollection = mongoClient.collection('attempts');

    app.get('/', (req, res, next) => {
        attemptsCollection.find({ deleted : null}).toArray()
            .then(attempts => {
                res.status(200).send(attempts);
            })
            .catch(next);
    });

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

    app.get('/:id', (req, res, next) => {
        attemptsCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
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

    app.post('/categories/:id', (req, res, next) => {

        let user = req.user

        categoriesCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
        }).toArray().then(results => {

            let tasks = []

            results.forEach(val => {
                (shuffle(val.tasks).slice(0, exam.categoryMap[val._id])).forEach(el => tasks.push(el))
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
            _id: new ObjectId(idToReplace),
            deleted: null
        }, {$set: attempt}).then((result) => {
            return res.status(200).send({message: 'updated'});
        }).catch(next);
    });

    app.get('/my', (req, res, next) => {
        attemptsCollection.find({
            user: req.user,
            deleted: null
        }).toArray().then(results => {
            res.status(200).send(results);
        }).catch(next);
    })

    app.post('/query/:id/:attId', (req, res, next) => {
        if (!req.body) {
            return res.status(400).send({message: 'Bad Request'});
        }
        let queryRequest = req.body;

        attemptsCollection.find({
            _id: new ObjectId(req.params.attId),
            deleted: null
        }).toArray().then(results => {
            let attempt = results[0]
            attempt.tasks.find({
                taskId: req.params.id
            }).toArray().then(result => {
                queryRequest.correctQuery = result[0].correctQuery
                let options = {
                    method: 'post',
                    body: queryRequest,
                    json: true,
                    url: 'http://localhost:8081/query'
                };
                request.post(options, (err, res) => {
                    console.log(err)
                    console.log(res)
                });

                res.status(200).end();
            })
        }).catch(next)

    })

// start attempt for exam - done
// start attempt for category - done

// get all my attempts - done
// get attempt with id - done
// send query for task and attempt


// show my results
// get results for attempt


// get all possible categories
// get category with id


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
