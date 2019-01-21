var expect = require('chai').expect

var hbsHelpers = require('../../src/helpers/hbs/helpers')

describe('Handlebars Helpers', function () {
  it('should return status name', function (done) {
    var strNew = hbsHelpers.helpers.statusName(0)
    var strOpen = hbsHelpers.helpers.statusName(1)
    var strPending = hbsHelpers.helpers.statusName(2)
    var strClosed = hbsHelpers.helpers.statusName(3)
    var strDefault = hbsHelpers.helpers.statusName()

    expect(strNew).to.equal('New')
    expect(strOpen).to.equal('Open')
    expect(strPending).to.equal('Pending')
    expect(strClosed).to.equal('Closed')
    expect(strDefault).to.equal('New')

    done()
  })
})
