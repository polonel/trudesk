/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    7/6/22 1:42 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React, { createRef } from 'react';
import PropTypes from 'prop-types';

class PDropdownTriggerList extends React.Component {
  containerRef = createRef();

  constructor(props) {
    super(props);
    this.state = {
      isHovered: false,
      timeoutId: null,
    };
  }

  componentDidMount() {}

  componentDidUpdate(prevProps, prevState, snapshot) {}

  componentWillUnmount() {}

  onTargetClick(e) {
    e.preventDefault();

    if (this.props.target && this.props.target.current && typeof this.props.target.current.show === 'function') {
      this.props.target.current.show(this.containerRef.current);
    }
  }

  render() {
    return (
      <div
        id="assigneeDropdown"
        ref={this.containerRef}
        className={'uk-clearfix'}
        onClick={(e) => {
          this.onTargetClick(e);
        }}
      >
        {this.props.children}
      </div>
    );
  }
}

PDropdownTriggerList.propTypes = {
  target: PropTypes.any.isRequired,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export default PDropdownTriggerList;
