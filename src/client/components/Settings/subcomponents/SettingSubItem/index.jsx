import React from 'react';
import PropTypes from 'prop-types';

class SettingSubItem extends React.Component {
    render() {
        const { title, subTitle, component, tooltip } = this.props;
        return (
            <div>
                <div className="uk-float-left uk-width-1-2">
                    <h5 style={{fontWeight: 'normal'}}>{title}
                        { tooltip &&
                        <i className="material-icons"
                           style={{color: '#888',
                               fontSize: '14px',
                               cursor: 'pointer',
                               lineHeight: '3px',
                               marginLeft: '4px'}}
                           data-uk-tooltip title={tooltip}>error</i>
                        }
                    </h5>
                    <p className="uk-text-muted">{subTitle}</p>
                </div>
                <div className="uk-float-right uk-width-1-2 uk-clearfix"
                     style={{position: 'relative', marginTop: '5px'}}>
                    <div className="uk-width-1-1 uk-float-right">
                        {component}
                    </div>
                </div>
            </div>
        );
    }
}

SettingSubItem.propTypes = {
    title: PropTypes.string.isRequired,
    subTitle: PropTypes.string,
    tooltip: PropTypes.string,
    component: PropTypes.element
};

export default SettingSubItem;