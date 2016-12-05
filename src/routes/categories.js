"use strict";

const express = require('express');
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
                    message: 'User not found.'
                });
            }

            res.status(200).send(result[0]);
        })
    });

    app.put('/:id', (req, res, next) => {
        let category = req.body;
        if(!category){
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
