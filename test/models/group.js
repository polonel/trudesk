/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var m = require('mongoose')
var groupSchema = require('../../src/models/group')

describe('group.js', function () {
  var groupId = m.Types.ObjectId()
  var memberId1 = m.Types.ObjectId()
  var memberId2 = m.Types.ObjectId()
  var memberId3 = m.Types.ObjectId()

  var nonMember1 = m.Types.ObjectId()

  it('should create a group', function (done) {
    groupSchema.create(
      {
        _id: groupId,
        name: 'Test Group',
        members: [memberId1, memberId2, memberId3],
        sendMailTo: []
      },
      function (err, group) {
        expect(err).to.not.exist
        expect(group).to.be.a('object')
        expect(group._doc).to.include.keys('_id', 'name', 'members', 'sendMailTo')

        done()
      }
    )
  })

  it('should get all groups', function (done) {
    groupSchema.getAllGroups(function (err, group) {
      expect(err).to.not.exist
      expect(group).to.have.length(2)

      done()
    })
  })

  it('should get group by id', function (done) {
    groupSchema.getGroupById(groupId, function (err, groups) {
      expect(err).to.not.exist
      expect(groups).to.be.a('object')

      done()
    })
  })

  it('should add group member', function (done) {
    groupSchema.getGroupByName('Test Group', function (err, group) {
      expect(err).to.not.exist
      expect(group).to.be.a('object')

      group.addMember(nonMember1, function (err, success) {
        expect(err).to.not.exist
        expect(success).to.equal(true)

        group.addMember(memberId1, function (err, success) {
          expect(err).to.not.exist
          expect(success).to.equal(true)

          done()
        })
      })
    })
  })

  it('should remove group member', function (done) {
    groupSchema.getGroupByName('Test Group', function (err, group) {
      expect(err).to.not.exist
      expect(group).to.be.a('object')
      var mem = {
        _id: memberId2
      }
      group.members = [mem]
      group.removeMember(memberId2, function (err, success) {
        expect(err).to.not.exist
        expect(success).to.equal(true)

        done()
      })
    })
  })
})
