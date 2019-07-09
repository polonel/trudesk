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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Helpers from 'modules/helpers'

// import './style.sass';

class NavButton extends Component {
  constructor (props) {
    super(props)
  }

  componentDidUpdate () {
    Helpers.UI.bindAccordion()
    Helpers.UI.tetherUpdate()
  }

  renderAnchorLink () {
    return (
      <a href={this.props.href} className={this.props.class} target={this.props.target || ''}>
        <i className='material-icons'>{this.props.icon}</i>
        {this.props.text}
      </a>
    )
  }

  render () {
    if (this.props.hasSubmenu) {
      return (
        <li
          className={'hasSubMenu' + (this.props.active ? ' active' : '')}
          data-nav-id={this.props.subMenuTarget}
          data-nav-accordion
          data-nav-accordion-target={'side-nav-accordion-' + this.props.subMenuTarget}
        >
          {this.renderAnchorLink()}
          {this.props.children}
        </li>
      )
    } else {
      return (
        <li className={this.props.active ? ' active ' : ''}>
          {this.renderAnchorLink()}
          {this.props.children}
        </li>
      )
    }
  }
}

NavButton.propTypes = {
  href: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  class: PropTypes.string,
  hasSubmenu: PropTypes.bool,
  subMenuTarget: PropTypes.string,
  active: PropTypes.bool,
  target: PropTypes.string,
  children: PropTypes.node
}

export default NavButton
