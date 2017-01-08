const express = require('express');
const uuid = require('uuid');
const ObjectId = require('mongodb').ObjectId;

module.exports = (mongoCollection) => {
    let app = express();

    app.get('/', (req, res, next) => {
        mongoCollection.find({
            deleted: null
        }).toArray()
            .then(users => {
                res.status(200).send(users);
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        mongoCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Category not found.'
                });
            }

            let category = result[0];
            res.status(200).send(category);
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
        mongoCollection.find({
            name: {$regex: query, $options: 'i' },
            deleted : null
        }).toArray().then(result => {
            res.status(200).send(result);
        }).catch(next);
    });

    app.get('/:id/tasks/:taskId', (req, res, next) => {
        mongoCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Category not found.'
                });
            }

            return result[0];
        }).then(result => {
            let task = result.tasks.find(
                function(element, index, array) {
                    return element.taskId == req.params.taskId;
                }
            )


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
            _id: new ObjectId(req.params.id),
            deleted: null
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

        let idToReplace = req.params.id;
        delete category._id;

        mongoCollection.findOneAndUpdate({
            _id: new ObjectId(idToReplace),
            deleted : null
        }, {$set: category}).then((result) => {
            return res.status(200).send({message: 'updated'});
        }).catch(next);
    });

    app.post('/', (req, res, next) => {
        let newCategory = req.body;
        let {name, tasks, description, hidden} = newCategory;
        mongoCollection.findOneAndUpdate(
            {name: newCategory.name, deleted : null}, {
                $setOnInsert: {name, tasks, description, hidden}
            }, {upsert: true})
            .then(mongoRes => {
                if(!!mongoRes.value){
                    return res.status(409).send({message: "Category with this name already exists"});
                }
                res.status(201).send(mongoRes);
            })
            .catch(next);
    });

    app.delete('/:id', (req, res, next) => {
        mongoCollection.find({
            _id: new ObjectId(req.params.id)
        }).toArray().then(result => {
            let object = result[0];

            object.deleted = true;
            delete object._id;

            mongoCollection.findOneAndUpdate({
                _id: new ObjectId(req.params.id)
            }, {$set: object}).then(results => {
                return res.status(200).send({message: 'deleted'});
            }).catch(next);

        }).catch(next);
    });

    return app;
};

