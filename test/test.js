
var path = require('path');
var expect = require('chai').expect;
var should = require('chai').should();
var nconf = require('nconf');


nconf.file({
    file: path.join(__dirname, '../config.json')
});

describe('nconf // mongodb', function() {
    it('fields should not be empty', function() {
        var host = nconf.get('mongo:host');
        var user = nconf.get('mongo:username');
        var pass = nconf.get('mongo:password');
        var port = nconf.get('mongo:port');
        var db = nconf.get('mongo:database');

        expect(host).to.be.a('string');
        expect(host).to.not.be.empty;

        user.should.be.a('string');
        user.should.not.be.empty;

        pass.should.be.a('string');
        pass.should.not.be.empty;

        port.should.be.a('string');
        port.should.not.be.empty;

        db.should.be.a('string');
        db.should.not.be.empty;
    });
});