var async       = require('async');
var expect      = require('chai').expect;
var should      = require('chai').should();

var permissions = require('../../src/permissions');

describe('premissions.js', function() {
    it('should return false', function(done) {
        var result = permissions.canThis(undefined, 'action:action');
        var result2 = permissions.canThis('fakerole', 'action:action');
        expect(result).to.be.false;
        expect(result2).to.be.false;

        done();
    });

    it('should allow all actions', function(done) {
        var result = permissions.canThis('support', 'comment:create');

        expect(result).to.be.true;

        done();
    });

    it('show allow note creation', function(done) {
        var result = permissions.canThis('support', 'notes:create');

        expect(result).to.be.true;

        done();
    })
});
