import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import helpers from 'lib/helpers';

import { updateSetting } from 'actions/settings';

class InputWithSave extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: ''
        };
    }

    componentDidMount() {
        helpers.UI.inputs();
    }

    static getDerivedStateFromProps(props, state) {
        if (!state.value) {
            state.value = (props.value) ? props.value : '';
            return state;
        }

        return null;
    }

    onSaveClicked() {
        this.props.updateSetting({name: this.props.settingName, value: this.state.value, stateName: this.props.stateName});
    }

    updateValue(evt) {
        this.setState({
            value: evt.target.value
        });
    }

    render() {
        return (
            <div className='uk-width-3-4 uk-float-right'>
                <div className="uk-width-3-4 uk-float-left" style={{paddingRight: '10px'}}>
                    <input id={this.props.stateName} className="md-input md-input-width-medium" type="text" value={this.state.value} onChange={evt => this.updateValue(evt)} />
                </div>
                <div className="uk-width-1-4 uk-float-right" style={{marginTop: '10px', textAlign: 'center'}}>
                    <button className="md-btn md-btn-small" onClick={e => (this.onSaveClicked(e))}>Save</button>
                </div>
            </div>
        );
    }
}

InputWithSave.propTypes = {
    updateSetting: PropTypes.func.isRequired,
    settingName: PropTypes.string.isRequired,
    stateName: PropTypes.string.isRequired,
    value: PropTypes.string
};

export default connect(null, { updateSetting })(InputWithSave);