const express = require('express');
const ObjectId = require('mongodb').ObjectId;

module.exports = (mongoClient) => {
    let app = express();
    let groupsCollection = mongoClient.collection('groups');
    let usersCollection = mongoClient.collection('users');

    app.get('/', (req, res, next) => {
        groupsCollection.find({deleted: null}).toArray()
            .then(groups => {
                res.status(200).send(groups);
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        groupsCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'Group not found.'
                });
            }

            res.status(200).send(result[0]);
        })
    });

    app.post('/search', (req, res, next) => {
        if (!req.body) {
            return next({
                status: 400,
                message: 'No body sent'
            })
        }
        let {query} = req.body;
        groupsCollection.find({
            name: {$regex: query, $options: 'i'},
            deleted: null
        }).toArray().then(result => {
            res.status(200).send(result);
        }).catch(next);
    });

    app.post('/', (req, res, next) => {
        let newGroup = req.body;
        let {name, description} = newGroup;

        groupsCollection.findOneAndUpdate({
            name: newGroup.name,
            deleted: null
        }, {
            $setOnInsert: {
                name, description,
                creationDate: new Date()
            }
        }, {upsert: true})
            .then(mongoRes => {
                if (!!mongoRes.value) {
                    return res.status(409).send({message: 'Group already exists.'})
                }
                res.status(201).send({
                    message: 'New group created.'
                });
            })
            .catch(next);
    });

    app.delete('/:id', (req, res, next) => {
        groupsCollection.findOneAndUpdate({
            _id: new ObjectId(req.params.id)
        }, {
            $set: {
                deleted: true
            }
        }).then(result => {
            return usersCollection.findOneAndUpdate({
                "group._id": new ObjectId(req.params.id)
            }, {
                $unset: {
                    group: null
                }
            })
        }).then(result => {
            return res.status(200).send({message: 'deleted'});
        }).catch(next);
    })

    return app;
};
