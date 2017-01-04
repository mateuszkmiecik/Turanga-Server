const crypto = require('crypto');

function user(name, displayName) {
    let sha256 = crypto.createHash('sha256');
    return {
        name: displayName,
        username: name,
        password: sha256.update(name).digest('hex'),
        role: name == 'admin' ? 'ADMIN' : 'USER'
    }
}

module.exports = [
    user('admin', 'Jan Kowalski'),
    user('user', 'Mateusz')
];