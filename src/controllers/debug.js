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

var _               = require('lodash');
var async           = require('async');
var path            = require('path');
var winston         = require('winston');

var debugController = {};

debugController.content = {};

debugController.populatedatabase = function(req, res) {
    var ticketSchema = require('../models/ticket');
    var ticketTypeSchema = require('../models/tickettype');
    var userSchema = require('../models/user');
    var groupSchema = require('../models/group');

    async.series([
        function(done) {
            var users = [];
            for (var i = 0; i < 11; i++) {
                var random = Math.floor(Math.random() * (10000 - 1 + 1)) + 1;
                var user = {
                    username: 'User.' + random,
                    fullname: 'User ' + random,
                    email: 'user.' + random + '@fakeemail.com',
                    password: 'password',
                    role: 'user'
                };

                users.push(user);
            }

            async.each(users, function(u, cb) {
                var U = new userSchema(u);
                U.save(cb);
            }, function(err) {
                done(err);
            })
        },
        function(done) {
            var groups = [];
            for (var i = 0; i < 11; i++) {
                var random = Math.floor(Math.random() * (10000 - 1 + 1)) + 1;
                var group = {
                    name: 'Test Group ' + random
                };

                groups.push(group)
            }

            async.each(groups, function(g, cb) {
                var G = new groupSchema(g);
                G.save(cb);
            }, function(err) { done(err); });
        },
        function(done) {
            userSchema.findAll(function(err, users) {
                groupSchema.getAllGroups(function(err, groups) {
                    ticketTypeSchema.getTypes(function(err, types) {
                        var tickets = [];
                        for (var i = 0; i < 100001; i++) { // 10000 Tickets
                            var user = users[Math.floor(Math.random()*users.length)];
                            var group = groups[Math.floor(Math.random()*groups.length)];
                            var type = types[Math.floor(Math.random()*types.length)];
                            var ticket = {
                                date: randomDate(new Date(2015, 0, 1), new Date()),
                                owner: user._id,
                                group: group._id,
                                type: type._id,
                                status: Math.floor(Math.random() * 4),
                                priority: Math.floor(Math.random() * 3) + 1,
                                subject: 'Example Ticket With ' + Math.floor(Math.random() * (10000 - 1 + 1)) + 1,
                                issue: 'Here is my issue Text'
                            };

                            winston.debug('Adding Ticket...(' + i+1 + ')');
                            tickets.push(ticket);
                        }

                        winston.debug('Saving Tickets...');
                        async.eachSeries(tickets, function(t, cb) {
                            var T = new ticketSchema(t);
                            T.save(function(err, savedTicket) {
                                if (err) return cb(err);
                                winston.debug('Saved Ticket - ' + savedTicket.uid);
                                T = null;

                                return cb(null);
                            });
                        }, function (err){ tickets = null; done(err); });
                    });
                });
            });
        }
    ], function(err) {
        if (err) return res.status(400).send(err);

        return res.send('OK');
    });
};

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// debugController.testexport = function(req, res) {
//     var ticketSchema = require('../models/ticket');
//     var csv          = require('csv');
//     var moment       = require('moment');
//     ticketSchema.getAll(function(err, tickets) {
//         if (err) return res.status(500).send(err);
//
//         var input = [];
//         for (var i = 0; i < 11; i++) {
//             var ticket = tickets[i];
//             var t = [];
//             t.push(ticket.uid);
//             t.push(ticket.priorityFormatted);
//             t.push(ticket.statusFormatted);
//             t.push(moment(ticket.date).format('MMM DD, YY HH:mm:ss'));
//             t.push(ticket.subject);
//             t.push(ticket.owner.fullname);
//             t.push(ticket.group.name);
//             if (ticket.assignee)
//                 t.push(ticket.assignee.fullname);
//             else
//                 t.push('');
//
//             input.push(t);
//         }
//
//         tickets = null;
//
//         var headers = {
//             uid: 'uid',
//             priority: 'priority',
//             status: 'status',
//             created: 'created',
//             subject: 'subject',
//             requester: 'requester',
//             group: 'group',
//             assignee: 'assignee'
//         };
//
//        csv.stringify(input, { header: true, columns: headers }, function(err, output) {
//            if (err) return res.status(500).send(err);
//
//            res.setHeader('Content-disposition', 'attachment; filename=report_output.csv');
//            res.set('Content-Type', 'text/csv');
//            res.send(output);
//        });
//     })
// };

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
                        to: 'polonel@outlook.com',
                        subject: 'Trudesk Launch',
                        html: html,
                        generateTextFromHTML: true
                    };

                    mailer.sendMail(mailOptions, function(err) {
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

    busboy.on('field', function(fieldname, val) {
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

module.exports = debugController;