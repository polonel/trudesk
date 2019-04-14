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
 *  Updated:    4/4/19 4:55 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import InfiniteScroll from 'react-infinite-scroller'

class TableInfiniteScroll extends InfiniteScroll {
  getParentElement (el) {
    console.log(el)
    return el
  }

  render () {
    return super.render()
  }
}

export default TableInfiniteScroll
