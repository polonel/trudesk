import { createAction } from 'redux-actions'
import { FETCH_NOTICES, UNLOAD_NOTICES } from 'actions/types'

export const fetchNotices = createAction(FETCH_NOTICES.ACTION)
export const unloadNotices = createAction(
  UNLOAD_NOTICES.ACTION,
  payload => payload,
  () => ({ thunk: true })
)
