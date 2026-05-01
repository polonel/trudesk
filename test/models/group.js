/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var m = require('mongoose')
var { GroupModel } = require('../../src/models')

describe('group.js', function () {
  var groupId = m.Types.ObjectId()
  var memberId1 = m.Types.ObjectId()
  var memberId2 = m.Types.ObjectId()
  var memberId3 = m.Types.ObjectId()
  var nonMember1 = m.Types.ObjectId()

  it('should create a group', function (done) {
    GroupModel.create(
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

  it('should get all groups', async function () {
    const groups = await GroupModel.getAllGroups()
    expect(groups).to.have.length(2) // 1 seeded default + 1 created above
  })

  it('should get group by id', async function () {
    const group = await GroupModel.getGroupById(groupId)
    expect(group).to.be.a('object')
  })

  it('should add group member', async function () {
    const group = await GroupModel.getGroupByName('Test Group')
    expect(group).to.be.a('object')

    const initialCount = group.members.length
    if (!group.members.some(id => id.toString() === nonMember1.toString())) {
      group.members.push(nonMember1)
    }
    await group.save()
    expect(group.members.length).to.equal(initialCount + 1)
  })

  it('should remove group member', async function () {
    const group = await GroupModel.getGroupByName('Test Group')
    expect(group).to.be.a('object')

    group.members = group.members.filter(id => id.toString() !== memberId2.toString())
    await group.save()
    expect(group.members.some(id => id.toString() === memberId2.toString())).to.be.false
  })
})
