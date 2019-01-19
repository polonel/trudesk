import React from 'react';
import PropTypes from 'prop-types';

class Menu extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ul className='settings-categories scrollable' style={{overflow: 'hidden auto'}}>
                {this.props.children}
            </ul>
        );
    }
}

Menu.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
    ]).isRequired
};

export default Menu;