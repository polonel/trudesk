/**
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/07/2017
 Author:     Chris Brame

 Desc:       Needed to load the page states from the initial load. Ajaxify
             handles the load after the initial.

 **/

define('pages/pageloader', ['async'], function(async) {
    var pageLoader = {};

    pageLoader.init = function(callback) {
        require([
            'pages/dashboard',
            'pages/messages',
            'pages/tickets',
            'pages/accounts',
            'pages/groups',
            'pages/profile',
            'pages/singleTicket',
            'pages/reports',
            'pages/reportsBreakdown',
            'pages/notices',
            'pages/createNotice',
            'pages/plugins',
            'pages/settings',
            'pages/logs',
            'pages/tags',

            'modules/ajaximgupload',
            'modules/attachmentUpload'
        ], function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
            async.parallel([
                function(done) { a.init(done); },
                function(done) { b.init(done); },
                function(done) { c.init(done); },
                function(done) { d.init(done); },
                function(done) { e.init(done); },
                function(done) { f.init(done); },
                function(done) { g.init(done); },
                function(done) { h.init(done); },
                function(done) { i.init(done); },
                function(done) { j.init(done); },
                function(done) { k.init(done); },
                function(done) { l.init(done); },
                function(done) { m.init(done); },
                function(done) { n.init(done); },
                function(done) { o.init(done); },
                function(done) {
                    p.init();
                    q.init();

                    done();
                }
            ], function() {
                if (typeof callback === 'function')
                    return callback();
            });
        });
    };

    return pageLoader
});