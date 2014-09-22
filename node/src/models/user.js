var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var userSchema = mongoose.Schema({
        username: String,
        password: String,
        fullname: String,
        email: String
    },
    {
        collection: 'accounts'
    });

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validate = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('accounts', userSchema);