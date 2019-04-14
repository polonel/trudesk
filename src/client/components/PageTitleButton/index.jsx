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
 *  Updated:    4/5/19 12:17 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

class PageTitleButton extends React.Component {
  render () {
    return (
      <div className={'pagination uk-float-left'}>
        <ul className='button-group uk-float-left'>
          <li className='pagination relative'>
            <a
              href={this.props.href}
              className={'btn no-ajaxy'}
              style={{ borderRadius: 3 }}
              onClick={this.props.onButtonClick}
            >
              {this.props.fontAwesomeIcon && <i className={`fa fa-large ${this.props.fontAwesomeIcon}`} />}
              {this.props.mdIcon && <i className={'material-icons'}>{this.props.mdIcon}</i>}
            </a>
          </li>
        </ul>
      </div>
    )
  }
}

PageTitleButton.propTypes = {
  href: PropTypes.string.isRequired,
  fontAwesomeIcon: PropTypes.string,
  mdIcon: PropTypes.string,
  onButtonClick: PropTypes.func
}

PageTitleButton.defaultProps = {
  href: '#'
}

export default PageTitleButton
