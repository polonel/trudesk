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
 *  Updated:    7/14/22 6:43 PM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

import { call, put, takeLatest } from 'redux-saga/effects'
import { GENERATE_REPORT } from 'actions/types'

import api from '../../api'
import Log from '../../logger'
import helpers from 'lib/helpers'

function downloadReport (response, filename) {
  const headers = response.headers
  const blob = new Blob([response.data], { type: headers['content-type'] })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  link.remove()
}

function * generateReport ({ payload, meta }) {
  try {
    const response = yield call(api.reports.generate, payload)
    yield put({ type: GENERATE_REPORT.SUCCESS, response, meta })
    downloadReport(response, payload.filename)
  } catch (error) {
    const errorText = error.response ? error.response.data.error : error
    if (error.response && error.response.status !== (401 || 403)) {
      Log.error(errorText, error)
      console.log(errorText)
      helpers.UI.showSnackbar(`Error: ${errorText}`, true)
    }

    yield put({ type: GENERATE_REPORT.ERROR, error })
  }
}

export default function * watch () {
  yield takeLatest(GENERATE_REPORT.ACTION, generateReport)
}
