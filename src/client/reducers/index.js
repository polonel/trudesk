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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { combineReducers } from 'redux'

import shared from './shared'
import common from './shared/common'
import modal from './shared/modalReducer'
import sidebar from './sidebarReducer'
import settings from './settings'
import tagsSettings from './tagsReducer'
import accountsState from './accountsReducer'

const IndexReducer = combineReducers({
  shared,
  common,
  modal,
  sidebar,
  accountsState,
  settings,
  tagsSettings
})

export default IndexReducer
