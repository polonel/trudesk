import {Provider} from 'react-redux';
import ReactDOM from 'react-dom';
import React from 'react';
import SettingsContainer from './containers/SettingsContainer';

export default function(store) {
    if (document.getElementById('settings-container')) {
        const SettingsContainerWithProvider = (
            <Provider store={store}>
                <SettingsContainer />
            </Provider>
        );

        ReactDOM.render(
            SettingsContainerWithProvider,
            document.getElementById('settings-container')
        );
    }
}