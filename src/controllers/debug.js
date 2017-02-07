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

debugController.uploadPlugin = function(req, res) {
    var fs = require('fs');
    var path = require('path');
    var Busboy = require('busboy');
    var busboy = new Busboy({
        headers: req.headers,
        limits: {
            files: 1,
            fileSize: 10 * 1024*1024 // 10mb limit
        }
    });

    var object = {}, error;

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        if (fieldname === 'plugin') object.plugin = val;
    });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        console.log(mimetype);
        if (mimetype.indexOf('x-zip-compressed') == -1) {
            error = {
                status: 500,
                message: 'Invalid File Type'
            };

            return file.resume();
        }

        var savePath = path.join(__dirname, '../../public/uploads/plugins');
        if (!fs.existsSync(savePath)) fs.mkdirSync(savePath);


        object.plugin = path.basename(filename);
        object.filePath = path.join(savePath, object.plugin);
        object.mimetype = mimetype;

        console.log(object);

        file.on('limit', function() {
            error = {
                status: 500,
                message: 'File too large'
            };

            // Delete the temp file
            //if (fs.existsSync(object.filePath)) fs.unlinkSync(object.filePath);

            return file.resume();
        });

        file.pipe(fs.createWriteStream(object.filePath));
    });

    busboy.on('finish', function() {
        if (error) return res.status(error.status).send(error.message);

        if (_.isUndefined(object.plugin) ||
            _.isUndefined(object.filePath)) {

            return res.status(500).send('Invalid Form Data');
        }

        // Everything Checks out lets make sure the file exists and then add it to the attachments array
        if (!fs.existsSync(object.filePath)) return res.status(500).send('File Failed to Save to Disk');

        var unzip = require('unzip');
        fs.createReadStream(object.filePath).pipe(unzip.Extract({path: path.join(__dirname, '../../plugins')}));

        return res.sendStatus(200);
    });

    req.pipe(busboy);
};

function handleError(res, err) {
    if (err) {
        return res.render('error', {layout: false, error: err, message: err.message});
    }
}

module.exports = debugController;