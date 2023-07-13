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

import React from 'react'
import ReactDOM from 'react-dom'
import { applyMiddleware, createStore, compose } from 'redux'
import { Provider } from 'react-redux'
import createSagaMiddleware from 'redux-saga'
import { middleware as thunkMiddleware } from 'redux-saga-thunk'
import IndexReducer from './reducers'
import IndexSagas from './sagas'
import { SingletonHooksContainer } from 'react-singleton-hook'

import App from './app/App'
import ModalRoot from './containers/Modals'

import SocketGlobal from 'containers/Global/SocketGlobal'
import SessionLoader from 'lib/sessionLoader'
import HotKeysGlobal from 'containers/Global/HotKeysGlobal'
import BackupRestoreOverlay from 'containers/Global/BackupRestoreOverlay'
import ChatDock from 'containers/Global/ChatDock'

const sagaMiddleware = createSagaMiddleware()

/*eslint-disable */
const composeSetup =
  process.env.NODE_ENV !== 'production' && typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : compose
/*eslint-enable */

// if (process.env.NODE_ENV !== 'production') {
localStorage.debug = 'trudesk:*'
// localStorage.setItem('debug', 'trudesk:*') // Enable logger
// }

export const store = createStore(IndexReducer, composeSetup(applyMiddleware(thunkMiddleware, sagaMiddleware)))

// This is need to call an action from angular
// Goal: remove this once angular is fully removed
window.react = {
  redux: store
}

sagaMiddleware.run(IndexSagas)

// Mount Globals
if (document.getElementById('globals')) {
  const GlobalsRoot = (
    <Provider store={store}>
      <>
        <SingletonHooksContainer />
        <SessionLoader />
        <SocketGlobal />
        {/*<HotKeysGlobal />*/}

        {/*<ChatDock />*/}
        <BackupRestoreOverlay />
      </>
    </Provider>
  )

  // ReactDOM.render(GlobalsRoot, document.getElementById('globals'))
}

if (document.getElementById('modal-wrapper')) {
  const RootModal = (
    <Provider store={store}>
      <ModalRoot />
    </Provider>
  )
  ReactDOM.render(RootModal, document.getElementById('modal-wrapper'))
}

if (document.getElementById('trudesk')) {
  const AppWithStore = <App store={store} />

  ReactDOM.render(AppWithStore, document.getElementById('trudesk'))
}
