import React from 'react';
import PropTypes from 'prop-types';

import IsArray from 'lodash/isArray';
import $ from 'jquery';

import Helpers from 'modules/helpers';

class Submenu extends React.Component {
    componentDidMount() {
        this.buildFloatingMenu(this.props.id);
    }

    componentDidUpdate() {
        this.buildFloatingMenu(this.props.id);
    }

    shouldComponentUpdate(nextProps) {
        if (this.props.children !== nextProps.children) {
            return true;
        } else {
            return false;
        }
    }

    buildFloatingMenu(navId) {
        if (this.props.children) {
            var $sideBarToRight = $('.sidebar-to-right');
            $sideBarToRight.find('#side-nav-sub-' + navId).remove();
            var ul = $('<ul id="side-nav-sub-' + this.props.id + '" class="side-nav-sub side-nav-floating"></ul>');
            var li = null;
            if (!IsArray(this.props.children)) {
                if (this.props.children.type.name === 'NavSeperator')
                    return;

                li = $('<li class="' + (this.props.children.props.active ? ' active ' : '') + '"><a href="' + this.props.children.props.href + '"><span>' + this.props.children.props.text +'</span></a></li>');
                ul.append(li);
            } else {
                var children = [];
                for (var i = 0; i < this.props.children.length; i++) {
                    if (!this.props.children[i])
                        continue;
                    if (this.props.children[i].type.name === 'NavSeperator')
                        ul.append('<hr />');
                    else {
                        if (this.props.children[i].props.hasSeperator)
                            ul.append('<hr />');
                        li = $('<li class="' + (this.props.children[i].props.active ? ' active ' : '') + '"><a href="' + this.props.children[i].props.href + '"><span>' + this.props.children[i].props.text + '</span></a></li>');
                        ul.append(li);
                    }
                }
            }

            $sideBarToRight.append(ul);

            Helpers.UI.setupSidebarTether()
            //Ajaxify new floating menu links
            $('body').ajaxify();
        }
    }

    render() {
        return (
            <ul id={"side-nav-accordion-" + this.props.id} className={"side-nav-sub side-nav-accordion" + ((this.props.subMenuOpen === true) ? ' subMenuOpen' : '')}>
                {this.props.children}
            </ul>
        )
    }
}

Submenu.proptypes = {
    id: PropTypes.string.isRequired,
    subMenuOpen: PropTypes.bool
}

export default Submenu;