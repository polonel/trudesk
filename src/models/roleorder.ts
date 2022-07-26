/*
     .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    10/30/2018
 Updated:    7/23/22 12:22 PM
 Author:     Chris Brame
 **/

import _ from 'lodash'
import { CallbackError, Document, HydratedDocument, model, Model, Schema, Types } from 'mongoose'

const COLLECTION = 'role_order'

export interface IRoleOrder extends Document {
  order: Array<Types.ObjectId>

  updateOrder(): void

  getHierarchy(): Array<IRoleOrder>
}

interface IRoleOrderModel extends Model<IRoleOrder> {
  getOrder(callback?: (err?: CallbackError, res?: HydratedDocument<IRoleOrder>) => void): Promise<HydratedDocument<IRoleOrder>>

  getOrderLean(callback?: (err?: CallbackError, res?: IRoleOrder) => void): Promise<IRoleOrder>
}

const schema = new Schema<IRoleOrder, IRoleOrderModel>({
  order: [Types.ObjectId]
})

schema.static('getOrder', function (callback) {
  return this.findOne({})
    .exec(callback)
})

schema.static('getOrderLean', function (callback) {
  return this.findOne({})
    .lean()
    .exec(callback)
})

schema.method('updateOrder', function (order: Array<string>, callback: (err: CallbackError, result: HydratedDocument<IRoleOrder>) => void) {
  this.order = order
  this.save(callback)
})

schema.method('getHierarchy', function (roleId: string | Types.ObjectId) {
  const idx = _.findIndex(this.order, function (i: Types.ObjectId) {
    return i.toString() === roleId.toString()
  })
  if (idx === -1) return []
  if (idx === 0) return this.order
  return _.drop(this.order, idx)
})

schema.method('removeFromOrder', function (_id, callback) {
  this.order = _.filter(this.order, function (o) {
    return o.toString() !== _id.toString()
  })

  this.save(callback)
})

const RoleOrderModel = model<IRoleOrder, IRoleOrderModel>(COLLECTION, schema, COLLECTION)

export default RoleOrderModel
module.exports = RoleOrderModel
