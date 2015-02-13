'use strict';

var async = require('async');
var fs = require('fs');
var path = require('path');
var prompt = require('prompt');
var winston = require('winston');
var nconf = require('nconf');

var install = {};
var questions = {};

questions.main = [
    {

    }
];

questions.optional = [
    {
        name: 'port',
        default: 3000
    }
];