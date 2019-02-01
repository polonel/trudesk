// var async       = require('async');
// var expect      = require('chai').expect;
// var should      = require('chai').should();
// var m           = require('mongoose');
// var messageSchema = require('../../src/models/chat/message');
//
// describe('message.js', function() {
//     // it('should clear collections.', function(done) {
//     //    expect(mongoose).to.exist;
//     //
//     //    dbHelper.clearCollections(mongoose, function(err) {
//     //        expect(err).to.not.exist;
//     //
//     //        done();
//     //    });
//     // });
//
//     // var messageId = m.Types.ObjectId();
//     // var ownerId = m.Types.ObjectId();
//     //
//     // it('should create message', function(done) {
//     //     messageSchema.create({
//     //         _id: messageId,
//     //         owner: ownerId,
//     //         from: m.Types.ObjectId(),
//     //         subject: 'This is the Subject',
//     //         message: 'This is the message'
//     //     }, function(err, message) {
//     //         expect(err).to.not.exist;
//     //         expect(message).to.be.a('object');
//     //         expect(message._doc).to.include.keys(
//     //             '_id', 'owner', 'folder', 'unread', 'from', 'subject', 'date', 'message'
//     //         );
//     //
//     //         done();
//     //     });
//     // });
//     //
//     // it('should mark as read', function(done) {
//     //      messageSchema.getMessageById(messageId, function(err, message) {
//     //          expect(err).to.not.exist;
//     //          expect(message).to.be.a('object');
//     //
//     //          message.updateUnread(undefined, function(err, message) {
//     //              expect(err).to.not.exist;
//     //              expect(message).to.be.a('object');
//     //              expect(message.unread).to.exist;
//     //              expect(message.unread).to.equal(false);
//     //
//     //              done();
//     //          });
//     //      });
//     // });
//     //
//     // it('should move to folder', function(done) {
//     //     messageSchema.getMessageById(messageId, function(err, message) {
//     //         expect(err).to.not.exist;
//     //         expect(message).to.be.a('object');
//     //
//     //         message.moveToFolder(1, function(err, message) {
//     //             expect(err).to.not.exist;
//     //             expect(message).to.be.a('object');
//     //             expect(message.folder).to.exist;
//     //             expect(message.folder).to.equal(1);
//     //
//     //             done();
//     //         });
//     //     });
//     // });
//     //
//     // it('should get message with object', function(done) {
//     //     var object = {
//     //         limit: 10,
//     //         page: 0,
//     //         folder: 1,
//     //         owner: ownerId
//     //     };
//     //
//     //     messageSchema.getMessagesWithObject(object, function(err, messages) {
//     //         expect(err).to.not.exist;
//     //         expect(messages).to.be.a('array');
//     //         expect(messages).to.have.length(1);
//     //
//     //         var message = messages[0];
//     //         expect(message._id).to.exist;
//     //
//     //         done();
//     //     });
//     // });
//     //
//     // it('should get unread message count of INBOX', function(done) {
//     //     messageSchema.getUnreadInboxCount(ownerId, function(err, count) {
//     //         expect(err).to.not.exist;
//     //         expect(count).to.equal(0);
//     //
//     //         done();
//     //     });
//     // });
//     //
//     // it('should get user folder', function(done) {
//     //     messageSchema.getUserFolder(ownerId, 1, function(err, messages) {
//     //         expect(err).to.not.exist;
//     //         expect(messages).to.have.length(1);
//     //
//     //         done();
//     //     });
//     // });
// });
