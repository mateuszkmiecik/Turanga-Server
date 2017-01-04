const express = require('express');
const ObjectId = require('mongodb').ObjectId;


module.exports = (mongoClient) => {

    let app = express();

    let categoriesCollection = mongoClient.collection('categories');
    let examsCollection = mongoClient.collection('exams');

    app.get('/:id', (req, res, next) => {

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
                attempt.dateStarted = present
                attempt.user = user
                attempt.duration = exam.duration
                attempt.lastUpdate = present
                attempt.tasks = tasks
                res.status(200).send(attempt)
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

