const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const request = require('request');

module.exports = (mongoClient) => {
    let app = express();

    let attemptsCollection = mongoClient.collection('attempts');

    app.get('/', (req, res, next) => {
        attemptsCollection.find({
            "user._id": new ObjectId(req.user._id)
        }).toArray().then(results => {
            res.status(200).send(results.map(attempt => {
                attempt.tasks = attempt.tasks.map(({taskId, name, description}) => ({taskId, name, description}))
                return attempt;
            }));
        }).catch(next);
    })

    app.get('/ex', (req, res, next) => {
        let isFinished = req.query.isFinished === "true";
        attemptsCollection.find({
            "user._id": new ObjectId(req.user._id),
            finished: isFinished,
            examId : { $exists : true}
        }).toArray().then(results => {
            res.status(200).send(results.map(attempt => {
                attempt.tasks = attempt.tasks.map(({taskId, name, description}) => ({taskId, name, description}))
                return attempt;
            }));
        }).catch(next);
    })

    app.get('/cat', (req, res, next) => {
        let isFinished = req.query.isFinished === "true";
        attemptsCollection.find({
            "user._id": new ObjectId(req.user._id),
            finished : isFinished,
            catId : { $exists : true}
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
            _id: new ObjectId(req.params.attId)
        }).toArray().then(results => {
            let attempt = results[0];
            let task = attempt.tasks.find((task) => {
                return task.taskId == req.params.id
            })

            queryRequest.correctQuery = task.correctQuery
            if(!!task.requiredWords) queryRequest.requiredWords = task.requiredWords.map(({text}) => (text))
            if(!!task.forbiddenWords) queryRequest.forbiddenWords = task.forbiddenWords.map(({text}) => (text))


            if(!!task.engineDB && !!task.engineDB[0]) {
                let {url, user, password, dbEngine} = task.engineDB[0]
                queryRequest.dbDetails = {url, user, password, db: dbEngine}
            }

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
                    "correct": !!resp ? resp.body.correct : false
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
            "user._id": new ObjectId(req.user._id)
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Attempt not found.'
                });
            }

            let attempt = result[0]
            if (attempt.finished == false && !!attempt.duration) {
                let durationInMs = attempt.duration * 60 * 1000
                if (Date.now() - attempt.dateStarted >= durationInMs) {
                    attempt.finished = true
                }
            }
            attempt.tasks = attempt.tasks.map(({taskId, name, description, engineDB, requiredWords, forbiddenWords}) => ({taskId, name, description, engineDB, requiredWords, forbiddenWords}))
            attempt.tasks.forEach(el => {
                el.engineDB = el.engineDB.map(({name, dbEngine, schemeFile}) => ({name, dbEngine, schemeFile}));
            })
            res.status(200).send(attempt);
        })
    });

    app.put('/:id/finish', (req, res, next) => {
        attemptsCollection.findOneAndUpdate({
            _id: new ObjectId(req.params.id),
            "user._id": new ObjectId(req.user._id)
        }, {$set: {finished: true}}, {returnOriginal : false}).then((result) => {

            let tasksId = new Set();
            let score = result.value.results.reduce((prev, curr, index, array) => {
                if (!tasksId.has(curr.taskId) && curr.correct) {
                    tasksId.add(curr.taskId);
                    return prev + 1;
                }
                return prev;
            }, 0);

            attemptsCollection.findOneAndUpdate({
                _id: new ObjectId(req.params.id),
                "user._id": new ObjectId(req.user._id)
            }, {$set: {score : score}}, {returnOriginal : false}).then(attempt => {
                res.status(200).send({message : "Attempt finished.", score : attempt.value.score, total : attempt.value.tasks.length})
            }).catch(next);

        }).catch(next);
    })

    return app;
};
