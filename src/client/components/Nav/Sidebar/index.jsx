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

import React, { Fragment } from 'react'
import { useLocation } from 'react-router-dom'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import SidebarItem from 'components/Nav/SidebarItem'
import NavSeparator from 'components/Nav/NavSeparator'
import Submenu from 'components/Nav/Submenu'
import SubmenuItem from 'components/Nav/SubmenuItem'

import { menu } from '../SidebarContent'

import { updateNavChange } from 'actions/nav'

import Helpers from 'lib/helpers'

function Location ({ children }) {
  let location = useLocation()
  return <>{children({ location })}</>
}

class Sidebar extends React.Component {
  componentDidMount () {
    // Helpers.UI.getPlugins((err, result) => {
    //   if (!err && result.plugins) {
    //     this.setState({ plugins: result.plugins })
    //   }
    // })
  }

  renderPlugins () {
    const { plugins, sessionUser, activeItem, activeSubItem } = this.state
    return (
      <SidebarItem
        text='Plugins'
        icon='extension'
        href='/plugins'
        class='navPlugins tether-plugins'
        hasSubmenu={plugins && plugins.length > 0}
        subMenuTarget='plugins'
        active={activeItem === 'plugins'}
      >
        {plugins && plugins.length > 0 && (
          <Submenu id='plugins' subMenuOpen={activeItem === 'plugins'}>
            {plugins.map(function (item) {
              const perms = item.permissions.split(' ')
              if (perms.indexOf(sessionUser.role) === -1) return
              return (
                <SubmenuItem
                  key={item.name}
                  text={item.menu.main.name}
                  icon={item.menu.main.icon}
                  href={item.menu.main.link}
                  active={activeSubItem === item.name}
                />
              )
            })}
          </Submenu>
        )}
      </SidebarItem>
    )
  }

  render () {
    const { isOpen, sessionUser } = this.props
    if (!sessionUser) return null
    return (
      <ul className='side-nav'>
        <Location>
          {({ location: { pathname } }) => {
            return menu.map((item, idx) => {
              if (item.divider) {
                return <NavSeparator key={new Date()} />
              }
              if (item.options) {
                if (item.perm && Helpers.canUser(item.perm, true)) {
                  return (
                    <SidebarItem
                      key={item.url}
                      text={item.label}
                      icon={item.icon}
                      active={pathname.startsWith(item.url)}
                      href={item.url}
                      hasSubmenu={true}
                      subMenuTarget={item.label.toLowerCase()}
                    >
                      <Submenu
                        id={item.label.toLowerCase()}
                        title={item.showTitle !== false && item.label}
                        // subMenuOpen={pathname.startsWith(item.url)}
                        subMenuOpen={false}
                        sidebarOpen={isOpen}
                      >
                        {item.options.map(subItem => {
                          if (subItem.divider) {
                            return <NavSeparator key={new Date()} />
                          }
                          if (subItem.perm && Helpers.canUser(subItem.perm, true)) {
                            return (
                              <SubmenuItem
                                key={subItem.url}
                                href={subItem.url}
                                text={subItem.label}
                                icon={subItem.icon}
                                active={pathname.startsWith(subItem.url)}
                              />
                            )
                          } else if (!subItem.perm) {
                            return (
                              <SubmenuItem
                                key={subItem.url}
                                href={subItem.url}
                                text={subItem.label}
                                icon={subItem.icon}
                                active={pathname.startsWith(subItem.url)}
                              />
                            )
                          }
                        })}
                      </Submenu>
                    </SidebarItem>
                  )
                }
              }

              return (
                <Fragment key={item.label + idx}>
                  {item.perm && Helpers.canUser(item.perm, true) && (
                    <SidebarItem
                      key={item.url}
                      text={item.label}
                      icon={item.icon}
                      href={item.url}
                      active={pathname.startsWith(item.url)}
                    />
                  )}
                  {!item.perm && item.customer === true && Helpers.canUser('customer:*', false) && (
                    <SidebarItem
                      key={item.url}
                      text={item.label}
                      icon={item.icon}
                      href={item.url}
                      active={pathname.startsWith(item.url)}
                    />
                  )}
                  {!item.perm && item.cloud && (sessionUser.cloudOwner || sessionUser.hasCloudPerm) && (
                    <SidebarItem
                      key={item.url}
                      text={item.label}
                      icon={item.icon}
                      href={item.url}
                      active={pathname.startsWith(item.url)}
                    />
                  )}
                  {!item.perm && !item.cloud && !item.customer && (
                    <SidebarItem
                      key={item.url}
                      text={item.label}
                      icon={item.icon}
                      href={item.url}
                      active={pathname.startsWith(item.url)}
                    />
                  )}
                </Fragment>
              )
            })
          }}
        </Location>
      </ul>
    )
  }
}

Sidebar.propTypes = {
  updateNavChange: PropTypes.func.isRequired,
  activeItem: PropTypes.string.isRequired,
  activeSubItem: PropTypes.string.isRequired,
  sessionUser: PropTypes.object,
  plugins: PropTypes.array,
  isOpen: PropTypes.bool
}

const mapStateToProps = state => ({
  activeItem: state.sidebar.activeItem,
  activeSubItem: state.sidebar.activeSubItem,
  sessionUser: state.shared.sessionUser
})

export default connect(mapStateToProps, { updateNavChange })(Sidebar)
