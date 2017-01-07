const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const crypto = require('crypto');

module.exports = (mongoCollection) => {
    let app = express();

    app.get('/', (req, res, next) => {
        mongoCollection.find({ deleted : null }).toArray()
            .then(users => {
                res.status(200).send(users);
            })
            .catch(next);
    });

    app.get('/:id', (req, res, next) => {
        mongoCollection.find({
            _id: new ObjectId(req.params.id),
            deleted : null
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

    app.post('/', (req, res, next) => {
        let newUsersData = req.body;
        let {name, username, password, role, group} = newUsersData;

        let sha256 = crypto.createHash('sha256');

        if (!! group) {
            group._id = new ObjectId(group._id)
        }


        mongoCollection.findOneAndUpdate(
            {username: newUsersData.username, deleted : null}, {
                $setOnInsert: {
                    name, username, role, group,
                    password: sha256.update(password).digest('hex'),
                    creationDate: new Date()
                }
            }, {upsert: true})
            .then(mongoRes => {
                if(!!mongoRes.value){
                    return res.status(409).send({message: 'User already exists.'})
                }
                res.status(201).send({
                    message: 'New user created.'
                });
            })
            .catch(next);
    });

    app.delete('/:id', (req, res, next) => {

        if (req.params.id == req.user._id) {
            return res.status(409).send({message: 'User is unable to delete himself.'})
        }

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
