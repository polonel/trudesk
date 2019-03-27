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
 *  Updated:    3/15/19 12:19 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

import helpers from 'lib/helpers'

class CardList extends React.Component {
  componentDidMount () {
    helpers.UI.hierarchicalSlide()
  }

  render () {
    const { header, headerRightComponent, children, extraClass } = this.props
    return (
      <div className={'md-card-list-wrapper' + (extraClass ? ' ' + extraClass : '')}>
        <div className={'md-card-list'}>
          {header && <div className={'md-card-list-header heading_list'}>{header}</div>}
          {headerRightComponent && <div className={'md-card-list-header-right'}>{headerRightComponent}</div>}
          <ul className={'hierarchical_slide'} data-delay='100ms'>
            {children}
          </ul>
        </div>
      </div>
    )
  }
}

CardList.propTypes = {
  header: PropTypes.string,
  headerRightComponent: PropTypes.element,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  extraClass: PropTypes.string
}

export default CardList
