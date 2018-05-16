import React from 'react';
import PropTypes from 'prop-types';

class SubmenuItem extends React.Component {
    render() {
        return (
            <div>
                {this.props.hasSeperator &&
                    <hr />
                }
                <li className={(this.props.active) ? ' active ' : ''}>
                    <a href={this.props.href}>
                        <i className="material-icons fa-sub-icon">{this.props.icon}</i>
                        {this.props.text}
                    </a>
                </li>
            </div>
        )
    }
}

SubmenuItem.proptypes = {
    href: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    hasSeperator: PropTypes.bool,
    active: PropTypes.bool
};

export default SubmenuItem;