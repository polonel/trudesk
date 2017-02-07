var path = require('path');
var pluginHelpers = require('../../../src/helpers/plugins');
var ipObj = require('../models/ipobj');
var pluginJson = require('../plugin.json');

var controller = {};

controller.get = function(req, res) {
    //Check plugin Permissions
    if (!pluginHelpers.checkPermissions(req.user.role, pluginJson.permissions))
        return res.redirect('/plugins');

    var self = this;
    self.content = {};
    self.content.title = "IPAM";
    self.content.nav = 'plugins';
    self.content.subnav = 'ipam';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;

    // var ip = ipobj.create({
    //     host: 'Tester',
    //     ipaddress: '192.168.1.1'
    // });

    ipObj.getAll(function(err, ipos) {
        if (err) return res.render('error', err);

        self.content.data.ipobjs = ipos;

        return res.render(path.join(__dirname, '../views/ipam'), self.content);
    });
};




module.exports = controller;