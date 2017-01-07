const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const request = require('request');

module.exports = (mongoClient) => {
    let app = express();

    let attemptsCollection = mongoClient.collection('attempts');

    app.get('/', (req, res, next) => {
        attemptsCollection.find({
            "user._id": new ObjectId(req.user._id),
            deleted: null
        }).toArray().then(results => {
            res.status(200).send(results.map(attempt => {
                attempt.tasks = attempt.tasks.map(({taskId, name, description}) => ({taskId, name, description}))
                return attempt;
            }));
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
            let attempt = results[0];
            let task = attempt.tasks.find((task) => {
                return task.taskId == req.params.id
            })

            queryRequest.correctQuery = task.correctQuery
            let options = {
                method: 'post',
                body: queryRequest,
                json: true,
                url: 'http://localhost:8081/query'
            };
            request.post(options, (err, resp) => {
                attempt.lastUpdate = Date.now()
                attempt.results.push({
                    "taskId": task.taskId,
                    "date": Date.now(),
                    "query": queryRequest.query,
                    "correct": resp.body.correct
                })

                let idToReplace = attempt._id;
                delete attempt._id;

                attemptsCollection.update({
                    _id: new ObjectId(idToReplace),
                    deleted: null
                }, {$set: attempt}).then((result) => {
                    resp.body.lastUpdate = attempt.lastUpdate
                    resp.body.attemptResults = attempt.results
                    res.status(200).send(resp.body)
                }).catch(next);
            });
        }).catch(next)

    })

    app.get('/:id', (req, res, next) => {
        attemptsCollection.find({
            _id: new ObjectId(req.params.id),
            "user._id": req.user._id,
            deleted: null
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Attempt not found.'
                });
            }

            let attempt = result[0]
            if (!!attempt.duration) {
                let durationInMs = attempt.duration * 60 * 1000
                if (Date.now() - attempt.dateStarted >= durationInMs) {
                    attempt.finished = true
                }
            }
            attempt.tasks = attempt.tasks.map(({taskId, name, description}) => ({taskId, name, description}))
            res.status(200).send(attempt);
        })
    });

    app.put('/:id/finish', (req, res, next) => {
        attemptsCollection.findOneAndUpdate({
            _id: new ObjectId(req.params.id),
            "user._id": new ObjectId(req.user._id),
            deleted: null
        }, {$set: {finished: true}}).then((result) => {
            res.status(200).send({message : "Attempt finished."})
        }).catch(next);
    })

    return app;
};
