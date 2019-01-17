import {Provider} from 'react-redux';
import GeneralSettings from 'components/Settings/General';
import ReactDOM from 'react-dom';
import React from 'react';

export default function(store) {
    if (document.getElementById('settings-general')) {
        const generalSettingsWithProvider = (
            <Provider store={store}>
                <GeneralSettings active={true} />
            </Provider>
        );

        ReactDOM.render(
            generalSettingsWithProvider,
            document.getElementById('settings-general')
        );
    }
}