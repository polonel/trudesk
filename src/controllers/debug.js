/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    11/06/2015
 Author:     Chris Brame

 **/

var async           = require('async');
var path            = require('path');
var winston         = require('winston');

var debugController = {};

debugController.content = {};

debugController.sendmail = function(req, res) {
    var mailer              = require('../mailer');
    var emailTemplates      = require('email-templates');
    var templateDir         = path.resolve(__dirname, '..', 'mailer', 'templates');

    emailTemplates(templateDir, function(err, template) {
        if (err) {
            winston.error(err);
        } else {

            template('ticket-updated', function(err, html) {
                if (err) {
                    winston.error(err);
                } else {
                    var mailOptions = {
                        to: 'chris.brame@granvillecounty.org',
                        subject: 'Trudesk Launch',
                        html: html,
                        generateTextFromHTML: true
                    };

                    mailer.sendMail(mailOptions, function(err, info) {
                        if (err) {
                            winston.warn(err);
                            return res.send(err);
                        }


                        return res.status(200).send('OK');
                    });
                }
            });
        }
    });
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = debugController;