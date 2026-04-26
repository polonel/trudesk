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

import { getModelForClass, modelOptions, prop, ReturnModelType } from '@typegoose/typegoose'

const COLLECTION = 'counters'

@modelOptions({ options: { customName: COLLECTION } })
export class CounterClass {
  @prop({ type: String })
  public _id!: string

  @prop({ default: 0 })
  public next!: number

  public static async increment(
    this: ReturnModelType<typeof CounterClass>,
    counter: string
  ): Promise<any> {
    return this.collection.findOneAndUpdate(
      { _id: counter },
      { $inc: { next: 1 } },
      { upsert: true }
    )
  }

  public static async setCounter(
    this: ReturnModelType<typeof CounterClass>,
    counter: string,
    count: number
  ): Promise<any> {
    return this.collection.findOneAndUpdate(
      { _id: counter },
      { $set: { next: count } },
      { upsert: true }
    )
  }
}

export default getModelForClass(CounterClass)
