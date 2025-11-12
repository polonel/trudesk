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
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

const mongoose = require('mongoose')

const COLLECTION = 'webhooks'

const deliveryLogSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['success', 'failed'], required: true },
    responseCode: { type: Number },
    message: { type: String },
    attempt: { type: Number, default: 1 },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
)

const webhookSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    url: { type: String, required: true, trim: true },
    events: { type: [String], default: [], index: true },
    secret: { type: String },
    enabled: { type: Boolean, default: true },
    lastStatus: { type: String, default: 'idle' },
    lastResponseCode: { type: Number },
    lastTriggeredAt: { type: Date },
    lastSuccessAt: { type: Date },
    lastFailureAt: { type: Date },
    lastError: { type: String },
    failureCount: { type: Number, default: 0 },
    logs: { type: [deliveryLogSchema], default: [] }
  },
  { timestamps: true }
)

webhookSchema.statics.recordLog = async function (webhookId, entry) {
  const maxEntries = 10
  const update = {
    $push: {
      logs: {
        $each: [entry],
        $slice: -maxEntries
      }
    }
  }

  return this.model(COLLECTION).findByIdAndUpdate(webhookId, update).exec()
}

module.exports = mongoose.model(COLLECTION, webhookSchema)
