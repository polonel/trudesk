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

import { find } from 'lodash'
import { fromJS, Map, List } from 'immutable'
import { handleActions } from 'redux-actions'
import {
  BACKUP_NOW,
  CHANGE_DELETED_TICKETS_PAGE,
  FETCH_BACKUPS,
  FETCH_DELETED_TICKETS,
  FETCH_MONGODB_TOOLS,
  FETCH_SETTINGS,
  RESTORE_DELETED_TICKET,
  PERM_DELETE_TICKET,
  UPDATE_MULTIPLE_SETTINGS,
  UPDATE_SETTING
} from 'actions/types'

import helpers from 'lib/helpers'

const initialState = {
  loaded: false,
  settings: Map({}),
  hasMongoDBTools: false,
  backingup: false,
  backups: List([]),
  deletedTicketsCount: 0,
  allDeletedTickets: List([]),
  deletedTickets: List([])
}

const settingsReducer = handleActions(
  {
    [FETCH_SETTINGS.SUCCESS]: (state, action) => ({
      ...state,
      settings: fromJS(action.response.settings.data),
      loaded: true
    }),

    [UPDATE_SETTING.SUCCESS]: (state, action) => {
      const updatedSetting = find(action.response.updatedSettings, { name: action.payload.name })
      return {
        ...state,
        loaded: state.loaded,
        settings: state.settings.setIn(['settings', action.payload.stateName], updatedSetting)
      }
    },

    [UPDATE_SETTING.ERROR]: (state, action) => {
      helpers.UI.showSnackbar('Error: ' + action.error, true)
      return {
        ...state,
        loaded: state.loaded,
        settings: state.settings
      }
    },

    [UPDATE_MULTIPLE_SETTINGS.SUCCESS]: state => {
      return {
        ...state,
        loaded: state.loaded,
        settings: state.settings
      }
    },

    [FETCH_MONGODB_TOOLS.SUCCESS]: (state, action) => {
      return {
        ...state,
        hasMongoDBTools: action.response.success
      }
    },

    [FETCH_BACKUPS.SUCCESS]: (state, action) => {
      return {
        ...state,
        backups: fromJS(action.response.files)
      }
    },

    [BACKUP_NOW.PENDING]: state => {
      return {
        ...state,
        backingup: true
      }
    },

    [BACKUP_NOW.SUCCESS]: state => {
      return {
        ...state,
        backingup: false
      }
    },

    [BACKUP_NOW.ERROR]: state => {
      return {
        ...state,
        backingup: false
      }
    },

    [FETCH_DELETED_TICKETS.SUCCESS]: (state, action) => {
      return {
        ...state,
        deletedTicketsCount: action.response.deletedTickets.length,
        allDeletedTickets: fromJS(action.response.deletedTickets),
        deletedTickets: fromJS(action.response.deletedTickets.slice(0, 15))
      }
    },

    [RESTORE_DELETED_TICKET.SUCCESS]: (state, action) => {
      const deletedIdx = state.deletedTickets.findIndex(i => {
        return i.get('_id') === action.payload._id
      })
      const allDeletedIdx = state.allDeletedTickets.findIndex(i => {
        return i.get('_id') === action.payload._id
      })

      return {
        ...state,
        allDeletedTickets: state.allDeletedTickets.splice(allDeletedIdx, 1),
        deletedTickets: state.deletedTickets.splice(deletedIdx, 1)
      }
    },

    [CHANGE_DELETED_TICKETS_PAGE]: (state, action) => {
      const pageIndex = action.payload.pageIndex
      return {
        ...state,
        deletedTickets: state.allDeletedTickets.slice(pageIndex * 15, (pageIndex + 1) * 15)
      }
    },

    [PERM_DELETE_TICKET.SUCCESS]: (state, action) => {
      const deletedIdx = state.deletedTickets.findIndex(i => {
        return i.get('_id') === action.payload._id
      })
      const allDeletedIdx = state.allDeletedTickets.findIndex(i => {
        return i.get('_id') === action.payload._id
      })

      return {
        ...state,
        allDeletedTickets: state.allDeletedTickets.splice(allDeletedIdx, 1),
        deletedTickets: state.deletedTickets.splice(deletedIdx, 1)
      }
    }
  },
  initialState
)

export default settingsReducer
