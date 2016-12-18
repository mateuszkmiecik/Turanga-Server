const crypto = require('crypto');

function user(name) {
    let sha256 = crypto.createHash('sha256');
    return {
        username: name,
        password: sha256.update(name).digest('hex'),
        role: name == 'admin' ? 'ADMIN' : 'USER'
    }
}

module.exports = [
    user('admin'),
    user('user')
];