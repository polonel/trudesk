import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import helpers from 'lib/helpers';

import { updateSetting } from 'actions/settings';

class NumberWithSave extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.value
        };
    }

    componentDidMount() {
        helpers.UI.inputs();
    }

    static getDerivedStateFromProps(nextProps, state) {
        if (!state.value) {
            return {
                value: nextProps.value
            };
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
        let width = '75%';
        if (this.props.width)
            width = this.props.width;

        return (
            <div className='uk-width-3-4 uk-float-right'>
                <div className="uk-width-1-4 uk-float-right" style={{marginTop: '10px', textAlign: 'center'}}>
                    <button className="md-btn md-btn-small" onClick={e => (this.onSaveClicked(e))}>Save</button>
                </div>
                <div className="uk-width-3-4 uk-float-right" style={{paddingRight: '10px', width: width}}>
                    <input id={this.props.stateName} className="md-input" type="number" value={this.state.value} onChange={evt => this.updateValue(evt)} />
                </div>
            </div>
        );
    }
}

NumberWithSave.propTypes = {
    updateSetting: PropTypes.func.isRequired,
    settingName: PropTypes.string.isRequired,
    stateName: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    width: PropTypes.string
};

export default connect(null, { updateSetting })(NumberWithSave);