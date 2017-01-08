const express = require('express');
const ObjectId = require('mongodb').ObjectId;

module.exports = (dbCollection) => {
    let app = express();

    app.get('/', (req, res, next) => {
        dbCollection.find({deleted: null}).toArray()
            .then(groups => {
                res.status(200).send(groups);
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        dbCollection.find({
            _id: new ObjectId(req.params.id),
            deleted: null
        }).toArray().then(result => {
            if (!result.length) {
                return next({
                    status: 404,
                    message: 'DB not found.'
                });
            }

            res.status(200).send(result[0]);
        })
    });

    app.post('/', (req, res, next) => {
        let newDB = req.body;
        let {name, url, user, password, dbEngine, files} = newDB;

        dbCollection.findOneAndUpdate({
            name : newDB.name,
            url: newDB.url,
            user: newDB.user,
            password : newDB.password,
            dbEngine: newDB.dbEngine,
            deleted: null
        }, {
            $setOnInsert: {
                name, url, user, password, dbEngine, files
            }
        }, {upsert: true})
            .then(mongoRes => {
                if (!!mongoRes.value) {
                    return res.status(409).send({message: 'DB already exists.'})
                }
                res.status(201).send({
                    message: 'New DB created.'
                });
            })
            .catch(next);
    });

    app.put('/:id', (req, res, next) => {
        let updatedDB = req.body;
        delete updatedDB._id;
        dbCollection.findOneAndUpdate({
            _id : new ObjectId(req.params.id)
        }, {$set : updatedDB}, {returnOriginal : false}).then(results => {
            return res.status(200).send({message: 'updated'});
        }).catch(next);
    })

    app.delete('/:id', (req, res, next) => {
        dbCollection.findOneAndUpdate({
            _id: new ObjectId(req.params.id)
        }, {
            $set: {
                deleted: true
            }
        }).then(result => {
            return res.status(200).send({message: 'deleted'});
        }).catch(next);
    })

    return app;
};
