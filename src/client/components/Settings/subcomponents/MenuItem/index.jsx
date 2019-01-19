import React from 'react';
import PropTypes from 'prop-types';

class MenuItem extends React.Component {

    render() {
        const { title, active, onClick } = this.props;
        return (
            <li className={('setting-category') && (active ? ' active' : '')} onClick={onClick}>
                <div className='setting-category'>
                    <h3>{title}</h3>
                </div>
            </li>
        );
    }
}

MenuItem.propTypes = {
    title: PropTypes.string.isRequired,
    active: PropTypes.bool,
    onClick: PropTypes.func.isRequired
};

export default MenuItem;