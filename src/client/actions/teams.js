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
 *  Updated:    3/12/19 11:32 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import { createAction } from 'redux-actions'
import { CREATE_TEAM, DELETE_TEAM, FETCH_TEAMS, SAVE_EDIT_TEAM, UNLOAD_TEAMS } from 'actions/types'

export const fetchTeams = createAction(FETCH_TEAMS.ACTION, payload => payload, () => ({ thunk: true }))
export const createTeam = createAction(CREATE_TEAM.ACTION)
export const saveEditTeam = createAction(SAVE_EDIT_TEAM.ACTION)
export const deleteTeam = createAction(DELETE_TEAM.ACTION)
export const unloadTeams = createAction(UNLOAD_TEAMS.ACTION, payload => payload, () => ({ thunk: true }))
