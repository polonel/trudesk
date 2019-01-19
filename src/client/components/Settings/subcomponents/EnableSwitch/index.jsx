import React from 'react';
import PropTypes from 'prop-types';

class EnableSwitch extends React.Component {
    render() {
        return (
            <div className="uk-float-right md-switch md-green" style={{margin: '17px 0 0 0'}}>
                <label>
                    {this.props.label}
                    <input type="checkbox" id={this.props.stateName} name={this.props.stateName} onChange={this.props.onChange} checked={this.props.checked} />
                    <span className="lever"></span>
                </label>
            </div>
    );
    }
}

EnableSwitch.propTypes = {
    stateName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    checked: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
};

export default EnableSwitch;