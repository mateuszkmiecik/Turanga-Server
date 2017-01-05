const express = require('express');
const ObjectId = require('mongodb').ObjectId;

module.exports = (examCollection) => {
    let app = express();

    app.get('/', (req, res, next) => {
        examCollection.find({
            deleted : null
        }).toArray()
            .then(exams => {
                res.status(200).send(exams);
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        examCollection.find({
            _id: new ObjectId(req.params.id),
            deleted : null
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


    app.post('/search', (req, res, next) => {
        if(!req.body){
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


    app.post('/', (req, res, next) => {
        let exam = req.body;
        const {name, categoryMap, categoriesNames, timeLimited, duration} = exam;
        const examCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const objectToSave = {name, categoryMap, categoriesNames, timeLimited, examCode, creationDate: new Date()};
        if (timeLimited) {
            objectToSave.duration = duration
        }

        examCollection.findOneAndUpdate(
            {name: exam.name, deleted : null}, {
                $setOnInsert: objectToSave
            }, {upsert: true})
            .then(mongoRes => {
                if (!!mongoRes.value) {
                    return next({
                        status: 409,
                        message: `Exam with name "${exam.name}" already exists.`
                    })
                }
                res.status(201).send(mongoRes);
            })
            .catch(next);
    });

    app.delete('/:id', (req, res, next) => {
        examCollection.find({
            _id: new ObjectId(req.params.id)
        }).toArray().then(result => {
            let object = result[0];

            object.deleted = true;
            delete object._id;

            examCollection.findOneAndUpdate({
                _id: new ObjectId(req.params.id)
            }, {$set: object}).then(results => {
                return res.status(200).send({message: 'deleted'});
            }).catch(next);

        }).catch(next);
    });

    return app;
};
