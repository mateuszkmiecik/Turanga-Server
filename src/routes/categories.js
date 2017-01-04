const express = require('express');
const uuid = require('uuid');
const ObjectId = require('mongodb').ObjectId;

module.exports = (mongoCollection) => {
    let app = express();

    app.get('/', (req, res, next) => {
        mongoCollection.find().toArray()
            .then(users => {
                res.status(200).send(users);
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        mongoCollection.find({
            _id: new ObjectId(req.params.id)
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Category not found.'
                });
            }

            let category = result[0];
            category.tasks = category.tasks.map(({taskId, description}) => ({taskId, description}))

            res.status(200).send(category);
        })
    });

    app.get('/:id/tasks/:taskId', (req, res, next) => {
        mongoCollection.find({
            _id: new ObjectId(req.params.id)
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Category not found.'
                });
            }

            return result[0];
        }).then(result => {
            console.log(result);
            let task = result.tasks.find(
                function(element, index, array) {
                    console.log(element.taskId);
                    console.log(req.params.taskId);
                    return element.taskId == req.params.taskId;
                }
            )

            console.log(task);

            if (!task) {
                return next({
                    status: 404,
                    message: 'Task not found.'
                });
            }

            delete task.query;

            res.status(200).send(task)
        })
    });

    app.post('/:id/tasks', (req, res, next) => {
        mongoCollection.find({
            _id: new ObjectId(req.params.id)
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Category not found.'
                });
            }

            let category = result[0];
            let catId = category._id;
            delete category._id;
            let task = req.body;
            task.taskId = uuid.v4();
            category.tasks.push(task);

            mongoCollection.update({
                _id: new ObjectId(catId)
            }, {$set: category}).then((result) => {
                return res.status(200).send({message: 'task added'});
            }).catch(next);
        })
    });

    app.put('/:id', (req, res, next) => {
        let category = req.body;
        if (!category) {
            return next({
                status: 400,
                message: 'No category send'
            })
        }

        let idToReplace = category._id;
        delete category._id;
        console.log(category);

        mongoCollection.update({
            _id: new ObjectId(idToReplace)
        }, {$set: category}).then((result) => {
            return res.status(200).send({message: 'updated'});
        }).catch(next);
    });

    app.post('/', (req, res, next) => {
        let newCategory = req.body;
        mongoCollection.insertOne(newCategory)
            .then(mongoRes => {
                res.status(201).send(mongoRes);
            })
            .catch(next);
    });

    app.delete('/:id', (req, res, next) => {
        mongoCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        }).then(() => {
            res.status(200).end();
        }).catch(next);
    });

    return app;
};

