import isUndefined from 'lodash/isUndefined';
import React from 'react';
import PropTypes from 'prop-types';

class Button extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { small, flat, style, text, onClick, extraClass } = this.props;
        const classBuild = (small ? ' md-btn-small ' : '') + (flat ? ' md-btn-flat ' : '') + ((style && flat) ? ' md-btn-flat-' + style : (style) ? ' md-btn-' + style : '') + ' ' + extraClass;
        return (
            <button className={('md-btn' + classBuild)} onClick={onClick}>{text}</button>
        );
    }
}

Button.propTypes = {
    text: PropTypes.string.isRequired,
    flat: PropTypes.bool,
    style: PropTypes.string,
    small: PropTypes.bool,
    extraClass: PropTypes.string,
    onClick: PropTypes.func
};

export default Button;