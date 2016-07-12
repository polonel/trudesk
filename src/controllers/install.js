/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    07/11/2016
 Author:     Chris Brame

 **/

var async           = require('async'),
    path            = require('path'),
    _               = require('underscore'),
    _mixins         = require('../helpers/underscore'),
    nconf           = require('nconf'),
    winston         = require('winston'),
    moment          = require('moment');

var installController = {};

installController.content = {};

installController.index = function(req, res) {
    var self = installController;
    self.content = {};
    self.content.title = "Install Trudesk";
    self.content.layout = false;


    res.render('install', self.content);
};

installController.mongotest = function(req, res) {
    var database = require('../database');
    var data = req.body;

    var CONNECTION_URI = 'mongodb://' + data.username + ':' + data.password + '@' + data.host + ':' + data.port + '/' + data.database;

    var child = require('child_process').fork(path.join(__dirname, '../../src/install/mongotest'), { env: { FORK: 1, NODE_ENV: global.env, MONGOTESTURI: CONNECTION_URI } });
    child.on('message', function(data) {
        if (data.error) return res.status(400).json({success: false, error: data.error});

        return res.json({success: true});
    });


};

module.exports = installController;