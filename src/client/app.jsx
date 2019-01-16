import React from 'react';
import ReactDOM from 'react-dom';
import { applyMiddleware, createStore, compose } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';

import IndexReducer from './reducers';
import IndexSagas from './sagas';

const sagaMiddleware = createSagaMiddleware();

import Sidebar from './Components/Nav/Sidebar/index.jsx';

/*eslint-disable */
const composeSetup = process.env.NODE_ENV !== 'production' && typeof window === 'object' &&
window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;
/*eslint-enable */

const store = createStore(
    IndexReducer,
    composeSetup(applyMiddleware(sagaMiddleware))
);

// This is need to call an action from angular
// Goal: remove this once angular is fully removed
window.react.redux = { store };

sagaMiddleware.run(IndexSagas);

const sidebarWithProvider = (
    <Provider store={store}>
        <Sidebar/>
    </Provider>
);

ReactDOM.render(
    sidebarWithProvider,
    document.getElementById('side-nav')
);