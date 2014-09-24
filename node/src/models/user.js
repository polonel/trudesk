var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var COLLECTION = "accounts";

var userSchema = mongoose.Schema({
        username: String,
        password: String,
        fullname: String,
        email: String
    });

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validate = function(password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.statics.findAll = function(callback) {
    return this.model(COLLECTION).find({}, callback);
};

module.exports = mongoose.model(COLLECTION, userSchema);