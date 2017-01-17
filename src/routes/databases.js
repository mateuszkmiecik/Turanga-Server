const express = require('express');
const ObjectId = require('mongodb').ObjectId;

module.exports = (mongoClient) => {
    let app = express();
    let dbCollection = mongoClient.collection('databases');
    let catCollection = mongoClient.collection('categories');

    app.get('/', (req, res, next) => {
        dbCollection.find({deleted: null}).toArray()
            .then(dbs => {
                res.status(200).send(dbs);
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
        }, {$set : updatedDB}, {returnOriginal : false}).then(db => {
            catCollection.find({
                deleted : null,
            }).toArray().then(cats => {
                cats.forEach(cat => {
                    cat.tasks.forEach(task => {
                        if(task.engineDB[0]._id == new ObjectId(req.params.id)) {
                            task.engineDB[0] = req.body;
                            task.engineDB[0]._id = req.params.id;
                        }
                    });
                    catCollection.findOneAndUpdate({
                        _id : cat._id
                    }, {$set : cat})
                })
            })
            return res.status(200).send({message: 'updated'});
        }).catch(next);
    })

    app.delete('/:id', (req, res, next) => {
        let flag = false;
        catCollection.find({
            deleted : null
        }).toArray().then(cats => {
            cats.forEach(cat => {
                cat.tasks.forEach(task => {
                    if (task.engineDB[0]._id == new ObjectId(req.params.id)) {
                        flag = true;
                        return res.status(409).send({message: 'Unable to delete db. There are tasks still using it.'})
                    }
                })
            })
            if (!flag) {
                dbCollection.findOneAndUpdate({
                    _id: new ObjectId(req.params.id)
                }, {
                    $set: {
                        deleted: true
                    }
                }).then(result => {
                    return res.status(200).send({message: 'deleted'});
                }).catch(next);
            }
        })
    })

    return app;
};
