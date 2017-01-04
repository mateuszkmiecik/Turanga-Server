const express = require('express');
const ObjectId = require('mongodb').ObjectId;


module.exports = (mongoClient) => {
    let app = express();
    let categoriesCollection = mongoClient.collection('categories');
    let examsCollection = mongoClient.collection('exams');

    app.get('/', (req, res, next) => {
        examsCollection.find().toArray()
            .then(users => {
                res.status(200).send(users);
            })
            .catch(next);
    });

    app.post('/', (req, res, next) => {
        if (!req.body) {
            return res.status(400).send({message: 'Bad Request'});
        }

        let categoryMap = req.body.categoryMap;

        let catIds = Object.keys(categoryMap).map(val => new ObjectId(val))
        categoriesCollection.find({
            _id: { $in : catIds }
        }).toArray().then(results => {

            let tasks = []
            results.forEach( val => {
                (val.tasks.slice(0, categoryMap[val._id])).forEach( el => tasks.push(el))
            })

            let exam = {"tasks": tasks}
            exam.categories = results.map(({name}) => ({name}))
            exam.duration = req.body.duration
            exam.shuffle = req.body.shuffle

            examsCollection.insertOne(exam)
                .then(mongoRes => {
                    res.status(201).send(mongoRes);
                })
                .catch(next);
            //res.status(200).send(exam)
        })

    });


    app.get('/:id', (req, res, next) => {
        mongoCollection.find({
            _id: new ObjectId(req.params.id)
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Test not found.'
                });
            }
            res.status(200).send(result[0]);
        })
    });

    return app;
};