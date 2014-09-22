var express = require('express');
var router = express.Router();
var passport = require('passport');
var async = require('async');

/* GET home page. */
router.get('/', function(req,res,next) {
        if (req.isAuthenticated()) {
            return res.redirect('/dashboard');
        }

        next();

    }, function(req, res, next) {
        res.render('login', { title: 'Login', layout: false});
    });

router.route('/login')
    .get(function(req,res){
        res.redirect('/');
    })

    .post(passport.authenticate('local', {
        successRedirect : '/dashboard',
        failureRedirect : '/',
        failureFlash : true
    }));

router.get('/logout', function(req,res, next) {
    req.logout();
    res.redirect('/');
});

router.get('/dashboard', isLoggedIn, function(req, res) {
    console.log('asdf=' + createDataObject(req, res));
    res.render('dashboard', {
        title: 'Dashboard',
        nav: 'dashboard',
        data: createDataObject(req, res)
    });
});

router.get('/tickets', isLoggedIn, function(req, res) {
    res.render('tickets', {
        title: 'Tickets',
        nav: 'tickets',
        data: createDataObject(req, res)
    });
});

router.get('/messages', isLoggedIn, function(req, res) {
    res.render('messages', {
        title: 'Messages',
        nav: 'messages',
        subnav: 'messages-inbox'
    });
});

router.get('/messages/inbox', isLoggedIn, function(req, res) {
    res.render('messages', {
        title: 'Messages - Inbox',
        nav: 'messages',
        subnav: 'messages-inbox'
    });
});

router.get('/calendar', isLoggedIn, function(req, res) {
    res.render('calendar', {
        title: 'Calendar',
        nav: 'calendar'
    });
});

router.get('/servers', isLoggedIn, function(req, res) {
    res.render('servers', {
        title: 'Servers',
        nav: 'servers'
    });
});

// CHECK IF USER IS AUTH
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

function createDataObject(req, res) {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }

    var User = require('../src/models/user');

    var data = {};
    async.waterfall([
        function(callback){
            User.findOne({'username': req.user.username}, function(err, obj) {
                if (err) {
                    return res.send(err);
                }
                data.user = obj;
                callback(null, data);
            });
        }
    ], function(err, result) {
        data = result;
    });

    return data;
}

module.exports = router;