/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    3/13/19 12:21 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var async = require('async')
var tSortingSchema = require('../../../models/tsorting')
var apiTSortings = {}

apiTSortings.get = function(req, res) {

    var tSortings = []

    async.parallel(
        [
            function(done) {
                tSortingSchema.find({}, function(err, t) {
                    if (err) return done(err)
                    tSortings = t
                    return done()
                })
            }
        ],
        function(err) {
            if (err) return res.status(400).json({ success: false, error: err })

            return res.json({ success: true, tSortings: tSortings })
        }
    )
}

apiTSortings.put = function(req, res) {
    const data = req.body;
    // tSortingSchema.updateOne({ ticketId: ticket._id }, { users: [] }, (err) => {
    //     if (err) console.log(err);
    //     tSortingSchema.updateOne({ userId: req.body }, { $push: { users: userId } }, (err, tcm) => {
    //         if (err) console.log(err);
    //         if (tcm.matchedCount == 0) {
    //             const tcm = {
    //                 ticketId: ticket._id,
    //                 ticketUid: ticket.uid,
    //                 users: [userId]
    //             }
    //             tSortingSchema.create(tcm, (err) => {
    //                 if (err) throw err
    //                 tSortingSchema.findOne({ ticketId: ticket._id }, (err, tcm) => {
    //                     emitter.emit('ticket:tcm:update', { tcm, ticket })
    //                 })
    //             })
    //         }
    //         tSortingSchema.findOne({ ticketId: ticket._id }, (err, tcm) => {
    //             emitter.emit('ticket:tcm:update', { tcm, ticket })
    //         })
    //     })
    // })
}

module.exports = apiTSortings