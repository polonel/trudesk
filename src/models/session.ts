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
 *  Updated:    5/16/22 3:01 PM
 *  Copyright (c) 2014-2022. All rights reserved.
 */
// This is used to connect to MongoStore for express-session to destroy the sessions of users

import { Document, model, Model, Schema, Types } from 'mongoose'
import winston from '../logger'
import type { UserModelClass } from "./user"

const COLLECTION = 'sessions_jwt'

interface ISession extends Document {
  _id: string
  user: Types.ObjectId | UserModelClass
  expires: Date
  session: string
  refreshToken: string
  exp: Date
}

interface ISessionModel extends Model<ISession> {
  destroyUserSession: (userId: string | Types.ObjectId) => Promise<void>
}

const SessionSchema = new Schema<ISession, ISessionModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'accounts' },
    expires: Date,
    session: String,
    refreshToken: String
  },
  { strict: false }
)

// SessionSchema.statics.getAllSessionUsers = async function () {}

SessionSchema.statics.getSession = async function (id) {
  return this.findOne({ id }).populate('user').exec()
}

SessionSchema.statics.getUserSessions = async function (userId) {
  return this.find({ user: userId }).populate('user').exec()
}

async function destroyUserSession(userId: string | Types.ObjectId): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    ;(async () => {
      try {
        if (!userId) return reject(new Error('Invalid User Id'))

        const userSessions = await SessionModel.find({})

        if (userSessions) {
          for (const s of userSessions) {
            const id = s._id
            const sessionObject = JSON.parse(s.session)

            if (
              sessionObject.passport &&
              sessionObject.passport.user &&
              sessionObject.passport.user === userId.toString()
            ) {
              delete sessionObject.passport
              await SessionModel.findOneAndUpdate({ _id: id }, { session: JSON.stringify(sessionObject) })
            }
          }

          return resolve()
        } else {
          return resolve()
        }
      } catch (e) {
        winston.error(e)
        return reject(e)
      }
    })()
  })
}

SessionSchema.static('destroyUserSession', destroyUserSession)
SessionSchema.static('destroy', destroyUserSession)

const SessionModel = model<ISession, ISessionModel>(COLLECTION, SessionSchema)

export default SessionModel
module.exports = SessionModel
