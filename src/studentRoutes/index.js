const express = require('express');
const ObjectId = require('mongodb').ObjectId;

module.exports = (mongoClient) => {
    let app = express();

    app.post('/exams/search', (req, res, next) => {});
    return app;

    // start attempt for exam
    // start attempt for category

    // get all my attempts
    // get attempt with id
    // send query for task and attempt


    // show my results
    // get results for attempt


    // get all possible categories
    // get category with id
};
