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
 *  Updated:    4/3/19 1:22 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react';
import PropTypes, { object } from 'prop-types';

class TableHeader extends React.Component {
  sortingDirection = '';
  activeTableHandler = '';
  constructor(props) {
    super(props);

    makeObservable(this);

    this.onTSortingsFetch = this.onTSortingsFetch.bind(this);
  }

  componentDidMount() {
    this.props.socket.on('$trudesk:client:tsortings:fetch', this.onTSortingsFetch);
    this.props.socket.on('$trudesk:client:tsorting:update', this.onTSortingUpdated);
  }

  onTSortingsFetch = (data) => {
    const userId = this.props.sessionUser._id;
    const tSorting = data.tSortings.find((tSorting) => tSorting.userId == userId);
    if (tSorting.sorting) {
      this.activeTableHandler = tSorting.sorting;
      this.sortingDirection = tSorting.direction;
    }
  };

  onTSortingUpdated = (data) => {
    if (this.props.text == activeTableHandler) {
      this.sortingDirection = data.tSorting.direction;
    }
  };

  clickTableHandler(text) {
    activeTableHandler = text;
  }

  render() {
    const { sortData, width, height, padding, textAlign, text, component } = this.props;

    return (
      <th
        style={{
          width: width,
          padding: padding,
          height: height,
          verticalAlign: 'middle',
          fontSize: 12,
          textTransform: 'uppercase',
          textAlign: textAlign,
          cursor: 'pointer',
        }}
        onClick={() => {
          sortData(text);
          this.clickTableHandler(text);
        }}
      >
        {component}
        {text}
        {this.activeTableHandler == text && this.sortingDirection == 'topDown' && (
          <span className="drop-icon material-icons" style={{ left: 'auto', top: 15 }}>
            keyboard_arrow_down
          </span>
        )}

        {this.activeTableHandler == text && this.sortingDirection == 'bottomUp' && (
          <span className="drop-icon material-icons" style={{ left: 'auto', top: 15 }}>
            keyboard_arrow_up
          </span>
        )}
      </th>
    );
  }
}

TableHeader.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  padding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  textAlign: PropTypes.string,
  text: PropTypes.string,
  component: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
};

TableHeader.defaultProps = {
  textAlign: 'left',
};

export default TableHeader;
