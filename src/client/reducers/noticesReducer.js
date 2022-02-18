import { fromJS, List } from 'immutable'
import { handleActions } from 'redux-actions'
import { FETCH_NOTICES, UNLOAD_NOTICES } from 'actions/types'

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
