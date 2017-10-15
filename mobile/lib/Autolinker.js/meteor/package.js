// package metadata file for Meteor.js
'use strict';

var packageName = 'autolinker:autolinker'; // https://atmospherejs.com/autolinker/autolinker
var where = 'client'; // where to install: 'client' or 'server'. For both, pass nothing.

var packageJson = JSON.parse(Npm.require("fs").readFileSync('package.json'));

Package.describe({
	name: packageName,
	summary: "Autolinker.js (official) - Automatically Link URLs, Email Addresses, Phone Numbers, Mentions (Twitter, Instagram), and Hashtags in a given block of text/HTML",
	version: packageJson.version,
	git: "https://github.com/gregjacobs/Autolinker.js.git"
});

Package.onUse(function(api) {
	api.versionsFrom(['METEOR@0.9.0', 'METEOR@1.0']);
	api.addFiles(['dist/Autolinker.js', 'meteor/export.js']);
	api.addFiles('meteor/helpers.js', ['client']);
	api.export('Autolinker');
});

Package.onTest(function(api) {
	api.use(packageName, where);
	api.use('tinytest');
	api.addFiles('meteor/test.js');
});
