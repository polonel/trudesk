var _           = require('underscore');
var async       = require('async');
var expect      = require('chai').expect;
var should      = require('chai').should();
var request     = require('supertest');
var superagent  = require('superagent');

describe('api/users.js', function() {

    var agent   = superagent.agent();
    var tdapikey = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';
    request = request('http://localhost:3111');

    it('should return users', function(done) {
        request.get('/api/v1/users?limit=10&page=0&search=trudesk')
          .set('accesstoken', tdapikey)
          .set('Accept', 'application/json')
          .expect(function(res) {
            console.log(res.body);
            if (res.body.count !== 1) throw new Error('Could not get users');
          })
          .expect(200, done);
    });

    it('should return a user', function(done) {
        request.get('/api/v1/users/trudesk')
          .set('accesstoken', tdapikey)
          .set('Accept', 'application/json')
          .expect(function(res) {
              if (res.body.user.username !== 'trudesk') throw new Error('Invalid User');
          })
          .expect(200, done);
    });

    it('should create new user', function(done) {
        var user = {
          'aUsername': 'new.user.1',
          'aPass': 'password',
          'aPassConfirm': 'password',
          'aFullname': 'New User',
          'aEmail': 'new.user.1@trudesk.io',
          'aRole': 'user',
          'aTitle': 'My New Title',
          'aGrps': []
        };

        async.parallel([
          function(cb) {
            request.post('/api/v1/users/create')
                .set('accesstoken', tdapikey)
                .set('Content-Type', 'application/json')
                .send(user)
                .set('Accept', 'application/json')
                .expect(200, {success: true}, cb);
          },
          function(cb) {
            user.aGrps = undefined;
            request.post('/api/v1/users/create')
                .set('accesstoken', tdapikey)
                .set('Content-Type', 'application/json')
                .send(user)
                .set('Accept', 'application/json')
                .expect(400, { success: false }, cb);
          },
          function(cb) {
            //password mismatch
            user.aPass = '2222';
            user.aGrps = [];
            request.post('/api/v1/users/create')
                .set('accesstoken', tdapikey)
                .set('Content-Type', 'application/json')
                .send(user)
                .set('Accept', 'application/json')
                .expect(400, {
                  success: false,
                  error: 'Invalid Password Match'
                }, cb);
          },
          function(cb) {
            request.post('/api/v1/users/create')
                .set('accesstoken', tdapikey)
                .send('undefined')
                .expect(400, {
                  success: false,
                  error: 'Invalid Post Data'
                }, cb);
          }
        ], function(err) {
            done();
        });
    });

    it('should update user', function(done) {
        async.waterfall([
            function(cb) {
                var userSchema = require('../../src/models/user');
                userSchema.getUserByUsername('trudesk', function(err, user) {
                    if (err) return cb(err);

                    return cb(null, user);
                });
            },
            function(user, cb) {
                var u = {
                  aId: user._id,
                  aUsername: user.username,
                  aFullname: user.fullname,
                  aPass: 'password',
                  aPassConfirm: 'password',
                  aTitle: 'The Title',
                  aEmail: user.email,
                  role: 'support',
                  groups: []
                };

                cb(null, u);
            }
        ], function(err, u) {
          if (err) return done(err)
          request.put('/api/v1/users/trudesk')
              .set('accesstoken', tdapikey)
              .set('Content-Type', 'application/json')
              .send(u)
              .set('Accept', 'application/json')
              .expect(function(res) {
                if (res.body.success !== true) throw new Error('Unable to update user');
              })
              .expect(200, done);
        });
    });

    it('should add user to group', function(done) {
        var groupSchema = require('../../src/models/group');
        var userSchema = require('../../src/models/user');

        groupSchema.getGroupByName('TEST', function(err, group) {
            expect(err).to.not.exist;

            userSchema.getUserByUsername('trudesk', function(err, user) {
                expect(err).to.not.exist;
                var u = {
                  aId: user._id,
                  aFullname: user.fullname,
                  aEmail: user.email,
                  aGrps: [group._id],
                  saveGroups: true
                };

                request.put('/api/v1/users/trudesk')
                    .set('accesstoken', tdapikey)
                    .set('Content-Type', 'application/json')
                    .send(u)
                    .set('Accept', 'application/json')
                    .expect(200, { success: true }, function() {
                        groupSchema.getGroupByName('TEST', function(err, grp) {
                            expect(err).to.not.exist;
                            expect(grp.isMember(user._id)).to.equal(true);

                            done();
                        })
                    });
            });
        });
    });

    it('should remove user from group', function(done) {
      var groupSchema = require('../../src/models/group');
      var userSchema = require('../../src/models/user');

      groupSchema.getGroupByName('TEST', function(err, group) {
          expect(err).to.not.exist;

          userSchema.getUserByUsername('trudesk', function(err, user) {
              expect(err).to.not.exist;
              var u = {
                aId: user._id,
                aFullname: user.fullname,
                aEmail: user.email,
                aGrps: [],
                saveGroups: true
              };

              request.put('/api/v1/users/trudesk')
                  .set('accesstoken', tdapikey)
                  .set('Content-Type', 'application/json')
                  .send(u)
                  .set('Accept', 'application/json')
                  .expect(200, { success: true }, function() {
                      groupSchema.getGroupByName('TEST', function(err, grp) {
                          expect(err).to.not.exist;
                          expect(grp.isMember(user._id)).to.equal(false);

                          done();
                      })
                  });
          });
      });
    });

    it('should update user preference', function(done) {
        var data = {
            preference: 'autoRefreshTicketGrid',
            value: false
        };

        request.put('/api/v1/users/trudesk/updatepreferences')
            .set('accesstoken', tdapikey)
            .set('Content-Type', 'application/json')
            .send(data)
            .set('Accept', 'application/json')
            .expect(function(res) {
                if (res.body.success !== true ||
                    res.body.user.preferences.autoRefreshTicketGrid !== false)
                      throw new Error('Unable to update user');
            })
            .expect(200, done);
    });

    it('should delete user', function(done) {
        request.delete('/api/v1/users/fake.user')
          .set('accesstoken', tdapikey)
          .set('Accept', 'application/json')
          .expect(200, {
            success: true,
            disabled: false
          }, done);
    });
});
