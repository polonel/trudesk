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
 *  Updated:    2/2/19 8:45 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import findIndex from 'lodash/findIndex'
import Menu from 'components/Settings/subcomponents/Menu'
import MenuItem from 'components/Settings/subcomponents/MenuItem'
import SplitSettingsPanelBody from 'components/Settings/subcomponents/SplitSettingsPanel/body'

class SplitSettingsPanel extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      activeChild: ''
    }
  }

  componentDidUpdate () {
    if (findIndex(this.props.menuItems, ['key', this.state.activeChild]) === -1 && this.props.menuItems.length > 0) {
      this.setState({
        activeChild: this.props.menuItems[0].key
      })
    }
  }

  switchChild (key) {
    this.setState({
      activeChild: key
    })
  }

  render () {
    const { title, subtitle, rightComponent, menuItems } = this.props
    return (
      <div className='setting-item-wrap uk-margin-medium-bottom'>
        <div
          className='panel trupanel nopadding no-hover-shadow uk-overflow-hidden'
          style={{ minHeight: '60px', height: 'auto' }}
        >
          <div className='left'>
            <h6 style={{ padding: '0 0 0 15px', margin: '15px 0 0 0', fontSize: '16px', lineHeight: '14px' }}>
              {title}
            </h6>
            <h5 style={{ padding: '0 0 10px 15px', margin: '2px 0 0 0', fontSize: '12px' }} className={'uk-text-muted'}>
              {subtitle}
            </h5>
          </div>
          <div className='right'>
            <div style={{ margin: '12px 10px 0 0' }}>{rightComponent}</div>
          </div>
          <hr className='nomargin-top clear' />
          <div className='panel-body2'>
            <div className='uk-grid uk-grid-collapse'>
              <div
                className='split-panel-categories uk-width-1-4 scrollable br'
                style={{ minHeight: '300px', maxHeight: '2000px', overflow: 'hidden auto' }}
              >
                <Menu hideBorders={true}>
                  {menuItems.map(item => {
                    return (
                      <MenuItem
                        active={this.state.activeChild === item.key}
                        key={item.key}
                        title={item.title}
                        onClick={() => {
                          this.switchChild(item.key)
                        }}
                      />
                    )
                  })}
                </Menu>
              </div>
              <div className='uk-width-3-4' style={{ padding: '20px 15px 15px 15px' }}>
                {menuItems.map(menuItem => {
                  return (
                    <SplitSettingsPanelBody
                      active={this.state.activeChild === menuItem.key}
                      key={menuItem.key}
                      component={menuItem.bodyComponent}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

SplitSettingsPanel.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  rightComponent: PropTypes.element,
  menuItems: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.object]).isRequired
}

export default SplitSettingsPanel
