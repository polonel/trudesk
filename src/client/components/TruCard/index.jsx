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
 *  Updated:    2/22/19 11:19 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import DropdownTrigger from 'components/Dropdown/DropdownTrigger'
import Dropdown from 'components/Dropdown'
import SpinLoader from 'components/SpinLoader'

class TruCard extends React.Component {
  render () {
    return (
      <div className={'tru-card-wrapper uk-position-relative'}>
        {this.props.loaderActive && <SpinLoader active={this.props.loaderActive} />}
        <div className={'tru-card tru-card-hover'}>
          <div className={'tru-card-head ' + (this.props.extraHeadClass || '')}>
            {this.props.menu && (
              <div className={'tru-card-head-menu'}>
                <DropdownTrigger pos={'bottom-right'} mode={'click'}>
                  <i className='material-icons tru-icon'>more_vert</i>
                  <Dropdown small={true}>
                    {this.props.menu.map(child => {
                      return child
                    })}
                  </Dropdown>
                </DropdownTrigger>
              </div>
            )}
            {/* HEADER TEXT */}
            <div className={'uk-text-center'}>{this.props.header}</div>
          </div>
          {/* Tru Card Content */}
          <div className={'tru-card-content ' + (this.props.extraContentClass || '')}>{this.props.content}</div>
        </div>
      </div>
    )
  }
}

TruCard.propTypes = {
  menu: PropTypes.arrayOf(PropTypes.element),
  header: PropTypes.element.isRequired,
  extraHeadClass: PropTypes.string,
  extraContentClass: PropTypes.string,
  content: PropTypes.element.isRequired,
  loaderActive: PropTypes.bool
}

TruCard.defaultProps = {
  loaderActive: false
}

export default TruCard
