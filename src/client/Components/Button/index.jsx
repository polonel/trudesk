import isUndefined from 'lodash/isUndefined';
import React from 'react';

class Button extends React.Component {
    constructor(props) {
        super(props);
        this.text = (isUndefined(props.text)) ? 'Button' : props.text;
    }

    render() {
        return (
            <button>{this.text}</button>
        );
    }
}

export default Button;