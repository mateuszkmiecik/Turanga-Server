const express = require('express');
const ObjectId = require('mongodb').ObjectId;

module.exports = (mongoCollection) => {
    let app = express();

    app.get('/', (req, res, next) => {
        mongoCollection.find().toArray()
            .then(groups => {
                res.status(200).send(groups);
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
                    message: 'Group not found.'
                });
            }

            res.status(200).send(result[0]);
        })
    });

    app.post('/', (req, res, next) => {
        let newGroup = req.body;
        let {name, description} = newGroup;

        mongoCollection.findOneAndUpdate(
            {name: newGroup.name}, {
                $setOnInsert: {
                    name, description,
                    creationDate: new Date()
                }
            }, {upsert: true})
            .then(mongoRes => {
                if(!!mongoRes.value){
                    return res.status(409).send({message: 'Group already exists.'})
                }
                res.status(201).send({
                    message: 'New group created.'
                });
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
