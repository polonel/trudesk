/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

var mongoose = require('mongoose');
var _ = require('underscore');

var COLLECTION = 'tickettypes';

/**
 * TicketType Schema
 * @module models/tickettype
 * @class TicketType

 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} name ```Required``` ```unique``` Name of Ticket Type
 */
var ticketTypeSchema = mongoose.Schema({
    name:       { type: String, required: true, unique: true }
});

/**
 * Return all Ticket Types
 *
 * @memberof TicketType
 * @static
 * @method getTypes
 *
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketTypeSchema.statics.getTypes = function(callback) {
    var q = this.model(COLLECTION).find({});

    return q.exec(callback);
};

/**
 * Return Single Ticket Type based on given type name
 *
 * @memberof TicketType
 * @static
 * @method getTypeByName
 *
 * @param {String} name Name of Ticket Type to search for
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketTypeSchema.statics.getTypeByName = function(name, callback) {
    var q = this.model(COLLECTION).findOne({name: name});

    return q.exec(callback);
};

module.exports = mongoose.model(COLLECTION, ticketTypeSchema);