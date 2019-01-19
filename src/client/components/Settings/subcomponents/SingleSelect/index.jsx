import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';

import helpers from 'lib/helpers';

class SingleSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.value
        };
    }

    componentDidMount() {
        helpers.UI.selectize();
        const $select = $(this.select);

        $select.on('change', this.props.onSelectChange);
    }

    componentWillUnmount() {
        const selectize = this.select.selectize;

        if (selectize)
            selectize.destroy();
    }

    static getDerivedStateFromProps(props, state) {
        if (props.value !== state.value) {
            return {
                value: props.value
            };
        }

        return null;
    }

    render() {
        const { items } = this.props;
        let width = '100%';

        if (this.select && this.select.selectize) {
            this.select.selectize.addOption(this.props.items);
            this.select.selectize.refreshOptions(false);
            this.select.selectize.addItem(this.state.value, true);
        }

        if (this.props.width)
            width = this.props.width;

        return (
            <div className="uk-width-1-1 uk-float-right" style={{paddingRight: '10px', width: width}}>
                <select className="selectize" ref={select => { this.select = select; }} data-md-selectize data-md-selectize-bottom value={this.state.value} onChange={this.props.onSelectChange}>
                    { items.map(function(obj, i) {
                        return <option key={i} value={obj.value}>{obj.label}</option>;
                    })}
                </select>
            </div>
        );
    }
}

SingleSelect.propTypes = {
    value: PropTypes.string,
    width: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    onSelectChange: PropTypes.func.isRequired
};

export default SingleSelect;