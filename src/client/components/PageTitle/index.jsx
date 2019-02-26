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
 *  Updated:    2/22/19 11:32 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

class PageTitle extends React.Component {
  render () {
    const { title, rightComponent, shadow } = this.props
    return (
      <div className={'nopadding'}>
        <div className={'uk-width-1-1 page-title dt-borderBottom pl-25 uk-clearfix' + (!shadow ? ' noshadow' : '')}>
          <p className={'uk-float-left'}>{title}</p>
          <div className={'uk-float-right uk-clearfix uk-width-1-2'}>{rightComponent}</div>
        </div>
      </div>
    )
  }
}

PageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  shadow: PropTypes.bool,
  rightComponent: PropTypes.element
}

PageTitle.defaultProps = {
  shadow: false
}

export default PageTitle
