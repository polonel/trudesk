var async = require('async');

var serversController = {};

serversController.content = {};

serversController.get = function(req, res, next) {
    var self = this;
    self.content = {};
    self.content.title = "Servers";
    self.content.nav = 'servers';
    self.content.data = {};
    self.content.data.user = req.user;

    res.render('servers', self.content);
};

module.exports = serversController;