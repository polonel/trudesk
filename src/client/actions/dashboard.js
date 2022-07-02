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
 *  Updated:    7/2/22 5:23 AM
 *  Copyright (c) 2014-2022. Trudesk Inc (Chris Brame) All rights reserved.
 */

import { createAction } from 'redux-actions'
import {
  FETCH_DASHBOARD_DATA,
  FETCH_DASHBOARD_TOP_GROUPS,
  FETCH_DASHBOARD_TOP_TAGS,
  FETCH_DASHBOARD_OVERDUE_TICKETS
} from 'actions/types'

export const fetchDashboardData = createAction(
  FETCH_DASHBOARD_DATA.ACTION,
  payload => payload,
  () => ({ thunk: true })
)

export const fetchDashboardTopGroups = createAction(FETCH_DASHBOARD_TOP_GROUPS.ACTION, payload => payload)
export const fetchDashboardTopTags = createAction(FETCH_DASHBOARD_TOP_TAGS.ACTION, payload => payload)
export const fetchDashboardOverdueTickets = createAction(FETCH_DASHBOARD_OVERDUE_TICKETS.ACTION)
