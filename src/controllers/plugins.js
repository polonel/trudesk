/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/03/2017
 Author:     Chris Brame

 **/

var _               = require('underscore');

var pluginsController = {};

pluginsController.get = function(req, res) {
    var self = this;
    self.content = {};
    self.content.title = "Plugins";
    self.content.nav = 'plugins';

    self.content.data = {};
    self.content.data.user = req.user;
    self.content.data.common = req.viewdata;
    self.content.data.plugins = {};
    self.content.data.plugins.installed = JSON.stringify(global.plugins, null, 2);

    res.render('plugins', self.content);
};

// function handleError(res, err) {
//     if (err) {
//         return res.render('error', {layout: false, error: err, message: err.message});
//     }
// }

module.exports = pluginsController;