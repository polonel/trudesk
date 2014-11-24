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
    self.content.data.common = req.viewdata;

    res.render('servers', self.content);
};

module.exports = serversController;