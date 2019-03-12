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
 *  Updated:    2/15/19 8:55 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

import { without, uniq } from 'lodash'

import SettingItem from 'components/Settings/SettingItem'
import EnableSwitch from 'components/Settings/EnableSwitch'
import PermSwitchPartial from './permSwitchPartial'

import helpers from 'lib/helpers'

@observer
class PermissionGroupPartial extends React.Component {
  @observable all = ''
  @observable create = ''
  @observable view = ''
  @observable update = ''
  @observable delete = ''
  @observable special = []

  @observable roleSpecials = ''

  componentDidMount () {
    this.all = this.props.grants.all || ''
    this.create = this.props.grants.create || ''
    this.view = this.props.grants.view || ''
    this.update = this.props.grants.update || ''
    this.delete = this.props.grants.delete || ''
    this.special = this.props.grants.special || []

    this.roleSpecials = this.props.roleSpecials || []
  }

  componentDidUpdate (prevProps) {
    if (prevProps.roleSpecials !== this.props.roleSpecials) this.roleSpecials = this.props.roleSpecials
    if (prevProps.grants !== this.props.grants) {
      if (prevProps.grants.all !== this.props.grants.all) this.all = this.props.grants.all
      if (this.all === true) {
        if (this.create !== true) this.create = true
        if (this.view !== true) this.view = true
        if (this.update !== true) this.update = true
        if (this.delete !== true) this.delete = true
        if (!helpers.arrayIsEqual(this.special, ['*'])) this.special = ['*']
      } else {
        if (prevProps.grants.create !== this.props.grants.create) this.create = this.props.grants.create
        if (prevProps.grants.view !== this.props.grants.view) this.view = this.props.grants.view
        if (prevProps.grants.update !== this.props.grants.update) this.update = this.props.grants.update
        if (prevProps.grants.delete !== this.props.grants.delete) this.delete = this.props.grants.delete
        if (prevProps.grants.special !== this.props.grants.special) this.special = this.props.grants.special
      }
    }
  }

  onEnableSwitchChanged (e, name) {
    if (name === 'all') {
      this.all = e.target.checked
      this.create = e.target.checked
      this.view = e.target.checked
      this.update = e.target.checked
      this.delete = e.target.checked
      if (e.target.checked) {
        this.special.replace(['*'])
      } else {
        this.special.clear()
      }
    } else {
      this[name] = e.target.checked
    }
  }

  hasSpecial (perm) {
    if (!this.special.length < 0) return false
    if (helpers.arrayIsEqual(this.special, ['*'])) return true
    return this.special.indexOf(perm) !== -1
  }

  onSpecialChanged (e, perm) {
    if (!perm) return
    if (this.all) return
    let arr = this.special
    if (e.target.checked) {
      arr.push(perm)
    } else {
      arr = without(arr, perm)
    }

    this.special.replace(uniq(arr))
  }

  render () {
    const { title, subtitle, role } = this.props
    return (
      <div>
        <SettingItem
          title={title}
          subtitle={subtitle}
          subPanelPadding={'0'}
          component={
            <EnableSwitch
              stateName={`all_perm_${title}_${role.get('_id')}`}
              label={'All'}
              checked={this.all}
              onChange={e => this.onEnableSwitchChanged(e, 'all')}
            />
          }
        >
          <PermSwitchPartial
            title={'Create'}
            checked={this.create}
            onChange={e => this.onEnableSwitchChanged(e, 'create')}
            disabled={this.all}
          />
          <PermSwitchPartial
            title={'View'}
            onChange={e => this.onEnableSwitchChanged(e, 'view')}
            checked={this.view}
            disabled={this.all}
          />
          <PermSwitchPartial
            title={'Update'}
            onChange={e => this.onEnableSwitchChanged(e, 'update')}
            checked={this.update}
            disabled={this.all}
          />
          <PermSwitchPartial
            title={'Delete'}
            onChange={e => this.onEnableSwitchChanged(e, 'delete')}
            checked={this.delete}
            disabled={this.all}
          />

          {/* SPECIALS */}
          {this.roleSpecials.length > 0 && (
            <div>
              <div className='panel-body2 bg-warn' style={{ padding: '0 10px' }}>
                <div className='uk-clearfix'>
                  <div className='left'>
                    <h6
                      className='text-dark'
                      style={{ padding: '0 0 0 15px', margin: '20px 0', fontSize: '18px', lineHeight: '14px' }}
                    >
                      Special Permissions
                    </h6>
                  </div>
                </div>
              </div>
              {this.roleSpecials.map(perm => {
                return (
                  <PermSwitchPartial
                    key={`${perm.title}_${perm.perm}`}
                    title={perm.title}
                    checked={this.hasSpecial(perm.perm)}
                    onChange={e => this.onSpecialChanged(e, perm.perm)}
                    disabled={this.all}
                  />
                )
              })}
            </div>
          )}
        </SettingItem>
      </div>
    )
  }
}

PermissionGroupPartial.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  roleSpecials: PropTypes.array,
  role: PropTypes.object.isRequired,
  grants: PropTypes.object.isRequired
}

export default PermissionGroupPartial
