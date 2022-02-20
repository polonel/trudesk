import { fromJS, List } from 'immutable'
import { handleActions } from 'redux-actions'
import { FETCH_NOTICES, UPDATE_NOTICE, DELETE_NOTICE, UNLOAD_NOTICES } from 'actions/types'

const initialState = {
  notices: List([]),
  loading: false
}

const reducer = handleActions(
  {
    [FETCH_NOTICES.PENDING]: (state, action) => {
      return {
        ...state,
        loading: true
      }
    },

    [FETCH_NOTICES.SUCCESS]: (state, action) => {
      return {
        ...state,
        notices: fromJS(action.response.notices || []),
        loading: false
      }
    },

    [UPDATE_NOTICE.SUCCESS]: (state, action) => {
      const notice = action.response.notice
      const idx = state.notices.findIndex(n => {
        return n.get('_id') === notice._id
      })

      return {
        ...state,
        notices: state.notices.set(idx, fromJS(notice))
      }
    },

    [DELETE_NOTICE.SUCCESS]: (state, action) => {
      const idx = state.notices.findIndex(n => {
        return n.get('_id') === action.payload._id
      })
      return {
        ...state,
        notices: state.notices.delete(idx)
      }
    },

    [UNLOAD_NOTICES.SUCCESS]: state => {
      return {
        ...state,
        notices: state.notices.clear(),
        loading: false
      }
    }
  },
  initialState
)

export default reducer
