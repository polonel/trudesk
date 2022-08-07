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
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import IsArray from 'lodash/isArray'
import $ from 'jquery'

import Helpers from 'lib/helpers'

const SubmenuWithNavigate = props => {
  const navigate = useNavigate()

  return <Submenu navigate={navigate} {...props} />
}

class Submenu extends Component {
  constructor (props) {
    super(props)

    this.buildFloatingMenu = this.buildFloatingMenu.bind(this)
  }

  componentDidMount () {
    this.buildFloatingMenu(this.props.id, this.props.title)
  }

  componentDidUpdate () {
    this.buildFloatingMenu(this.props.id, this.props.title)
  }

  shouldComponentUpdate (nextProps) {
    return this.props.children !== nextProps.children
  }

  buildFloatingMenu (navId, title) {
    const self = this
    if (this.props.children) {
      const $sideBarToRight = $('.sidebar-to-right')
      $sideBarToRight.find('#side-nav-sub-' + navId).remove()
      const ul = $('<ul id="side-nav-sub-' + this.props.id + '" class="side-nav-sub side-nav-floating"></ul>')
      let li = null
      if (!IsArray(this.props.children)) {
        const child = this.props.children
        if (child.type && child.type.name === 'NavSeparator') return

        li = $(`<li class="${child.props.active && 'active'}"></li>`)
        const anchor = $('<a href="#"></a>')
        anchor.click(function (e) {
          e.preventDefault()
          self.props.navigate(child.props.href)
        })
        anchor.append(`<span>${child.props.text}</span>`)
        li.append(anchor)
        ul.append(li)
      } else {
        if (title) {
          li = $(`<li class='uk-nav-header'>${title}</li>`)
          ul.append(li)
          ul.append('<hr />')
        }
        for (let i = 0; i < this.props.children.length; i++) {
          if (!this.props.children[i] || !this.props.children[i].type) continue
          const child = this.props.children[i]
          if (child.type.name === 'NavSeparator') ul.append('<hr />')
          else {
            if (child.props.hasSeparator) ul.append('<hr />')
            li = $(`<li class="${child.props.active && 'active'}"></li>`)
            const anchor = $(`<a href="#"></a>`)
            anchor.click(function (e) {
              e.preventDefault()
              self.props.navigate(`${child.props.href}`)
            })
            anchor.append(`<span>${child.props.text}</span>`)
            li.append(anchor)
            ul.append(li)
          }
        }
      }

      $sideBarToRight.append(ul)

      Helpers.UI.setupSidebarTether()
    }
  }

  render () {
    const { sidebarOpen, subMenuOpen } = this.props
    return (
      <ul
        id={'side-nav-accordion-' + this.props.id}
        className={clsx('side-nav-sub', 'side-nav-accordion', sidebarOpen && subMenuOpen && 'subMenuOpen')}
      >
        {this.props.children}
      </ul>
    )
  }
}

Submenu.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  subMenuOpen: PropTypes.bool,
  sidebarOpen: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  navigate: PropTypes.func.isRequired
}

export default SubmenuWithNavigate
