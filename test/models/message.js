var async       = require('async');
var expect      = require('chai').expect;
var should      = require('chai').should();
var m           = require('mongoose');
var messageSchema = require('../../src/models/message');

describe('message.js', function() {
    //it('should clear collections.', function(done) {
    //    expect(mongoose).to.exist;
    //
    //    dbHelper.clearCollections(mongoose, function(err) {
    //        expect(err).to.not.exist;
    //
    //        done();
    //    });
    //});

    var messageId = m.Types.ObjectId();
    var ownerId = m.Types.ObjectId();

    it('should create message', function(done) {
        messageSchema.create({
            _id: messageId,
            owner: ownerId,
            from: m.Types.ObjectId(),
            subject: 'This is the Subject',
            message: 'This is the message'
        }, function(err, message) {
            expect(err).to.not.exists;
            expect(message).to.be.a('object');
            expect(message._doc).to.include.keys(
                '_id', 'owner', 'folder', 'unread', 'from', 'subject', 'date', 'message'
            );

            done();
        });
    });

    it('should mark as read', function(done) {
         messageSchema.getMessageById(messageId, function(err, message) {
             expect(err).to.not.exist;
             expect(message).to.be.a('object');

             message.updateUnread(undefined, function(err, message) {
                 expect(err).to.not.exist;
                 expect(message).to.be.a('object');
                 expect(message.unread).to.exist;
                 expect(message.unread).to.equal(false);

                 done();
             });
         });
    });

    it('should move to folder', function(done) {
        messageSchema.getMessageById(messageId, function(err, message) {
            expect(err).to.not.exist;
            expect(message).to.be.a('object');

            message.moveToFolder(1, function(err, message) {
                expect(err).to.not.exist;
                expect(message).to.be.a('object');
                expect(message.folder).to.exist;
                expect(message.folder).to.equal(1);

                done();
            });
        });
    });
});
