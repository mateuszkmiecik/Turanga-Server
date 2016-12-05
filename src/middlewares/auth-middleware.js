"use strict";

let jwt = require('jsonwebtoken');
let secretKey = require('../../config/config').secret;

function middlewareWithStatus(status) {
    return (req, res, next) => {
        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        req.token = token;

        // decode token
        if (token) {
            // verifies secret and checks exp
            jwt.verify(token, secretKey, function (err, decoded) {
                if (err) {
                    next({
                        status: status || 403,
                        message: 'Failed to authenticate token.'
                    });
                    // return res.status(403).json({success: false, message: 'Failed to authenticate token.'});
                } else {
                    // if everything is good, save to request for use in other routes
                    req.user = decoded;
                    next();
                }
            });

        } else {
            return next({
                status: status || 403,
                message: "No token provided."
            });
        }
    }
}

let middleware = middlewareWithStatus();
middleware.withStatus = middlewareWithStatus;
module.exports = middleware;

