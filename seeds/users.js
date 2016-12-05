"use strict";

const crypto = require('crypto');

function user(name) {
    let md5 = crypto.createHash('md5');
    return {
        username: name,
        password: md5.update(name).digest('hex'),
        role: name == 'admin' ? 'ADMIN' : 'USER'
    }
}

module.exports = [
    user('admin'),
    user('user')
];