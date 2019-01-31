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

import { defineAction } from 'redux-define'
import { ERROR, SUCCESS } from './stateConstants'

// Shared
export const SET_SESSION_USER = defineAction('SET_SESSION_USER')

// Common Nav Change
export const NAV_CHANGE = defineAction('NAV_CHANGE')

// Settings
export const FETCH_SETTINGS = defineAction('FETCH_SETTINGS', [SUCCESS, ERROR])
export const UPDATE_SETTING = defineAction('UPDATE_SETTING', [SUCCESS, ERROR])
export const UPDATE_MULTIPLE_SETTINGS = defineAction('UPDATE_MULTIPLE_SETTINGS', [SUCCESS, ERROR])
export const UPDATE_COLORSCHEME = defineAction('UPDATE_COLORSCHEME', [SUCCESS, ERROR])
