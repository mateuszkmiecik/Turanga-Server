const express = require('express');
const ObjectId = require('mongodb').ObjectId;

module.exports = (examCollection) => {
    let app = express();

    app.get('/', (req, res, next) => {
        examCollection.find().toArray()
            .then(exams => {
                res.status(200).send(exams);
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        examCollection.find({
            _id: new ObjectId(req.params.id)
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Exam not found.'
                });
            }

            res.status(200).send(result[0]);
        })
    });

    app.post('/', (req, res, next) => {
        let exam = req.body;
        exam.examCode = Math.random().toString(36).substring(2,8).toUpperCase()
        examCollection.insertOne(exam)
            .then(mongoRes => {
                res.status(201).send(mongoRes);
            })
            .catch(next);
    });

    app.delete('/:id', (req, res, next) => {
        examCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        }).then(() => {
            res.status(200).end();
        }).catch(next);
    });

    return app;
};
