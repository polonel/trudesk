/* eslint-disable no-unused-expressions */
var expect = require('chai').expect
var { TicketTypeModel } = require('../../src/models')

describe('ticketType.js', function () {
  it('should create a ticket type', function (done) {
    TicketTypeModel.create({ name: 'Test Ticket Type' }, function (err, tt) {
      expect(err).to.not.exist
      expect(tt).to.be.a('object')
      expect(tt._doc).to.include.keys('_id', 'name')

      done()
    })
  })

  it('should get all ticket types', async function () {
    const types = await TicketTypeModel.getTypes()
    expect(types).to.be.a('array')
    expect(types).to.have.length(3) // 2 seeded defaults + 1 created above
  })

  it('should get ticket type by name', async function () {
    const type = await TicketTypeModel.getTypeByName('Test Ticket Type')
    expect(type).to.be.a('object')
  })
})
