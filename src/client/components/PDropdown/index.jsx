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
 *  Updated:    2/11/19 7:41 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

class PDropDown extends React.Component {
  dropRef = createRef()
  pTriggerRef = null

  constructor (props) {
    super(props)

    this.hideDropdownOnMouseUp = this.hideDropdownOnMouseUp.bind(this)
    this.closeOnClick = this.closeOnClick.bind(this)
  }

  hideDropdownOnMouseUp (e) {
    if (this.dropRef.current) {
      if (!this.dropRef.current.contains(e.target) && !this.pTriggerRef.contains(e.target)) {
        document.removeEventListener('mouseup', this.hideDropdownOnMouseUp)
        this.dropRef.current.classList.remove('pDropOpen')
      }
    }
  }

  closeOnClick (e) {
    if (this.dropRef.current) {
      document.removeEventListener('mouseup', this.hideDropdownOnMouseUp)
      this.dropRef.current.classList.remove('pDropOpen')
    }
  }

  show (pTrigger) {
    if (!pTrigger) {
      console.error('Invalid pTrigger sent to show method')
      return true
    }

    this.pTriggerRef = pTrigger

    if (this.dropRef.current) {
      const ref = this.dropRef.current
      if (ref.classList.contains('pDropOpen')) {
        ref.classList.remove('pDropOpen')

        return true
      }

      // Bind Doc event
      document.removeEventListener('mouseup', this.hideDropdownOnMouseUp)
      document.addEventListener('mouseup', this.hideDropdownOnMouseUp)

      const pageContent = document.getElementById('page-content')
      if (pageContent) {
        let pageOffsetLeft = 0
        let pageOffsetTop = 0
        let pTriggerOffsetLeft = pTrigger.getBoundingClientRect().left
        let pTriggerOffsetTop = pTrigger.getBoundingClientRect().top
        const pTriggerHeight = pTrigger.offsetHeight

        let left0 = 250
        if (ref.classList.contains('pSmall')) left0 = 180
        if (ref.classList.contains('p-dropdown-left')) left0 = 0

        if (pageContent.contains(pTrigger)) {
          pageOffsetLeft = pageContent.clientLeft
          pageOffsetTop = pageContent.clientTop
          pTriggerOffsetLeft = pTrigger.offsetLeft
          pTriggerOffsetTop = pTrigger.offsetTop
        }

        pageOffsetTop += pTriggerOffsetTop

        let left = pTriggerOffsetLeft - window.scrollX - pageOffsetLeft - left0

        if (this.props.leftOffset) left += Number(this.props.leftOffset)

        left = left + 'px'

        const topOffset = pTriggerOffsetTop - window.scrollY + pageOffsetTop
        let top = pTriggerHeight + topOffset

        if (this.props.topOffset) top += Number(this.props.topOffset)

        const noticeFrame = document.getElementById('notice-banner')
        let hasNotice = false
        if (noticeFrame) hasNotice = !noticeFrame.classList.contains('uk-hidden')
        if (hasNotice && !ref.classList.contains('opt-ignore-notice')) top -= 30

        top = top + 'px'

        const aLinks = ref.querySelectorAll('a')
        // eslint-disable-next-line no-unused-vars
        for (const link of aLinks) {
          link.removeEventListener('click', this.closeOnClick)
          link.addEventListener('click', this.closeOnClick)
        }

        const closeOnClick = ref.querySelectorAll('.close-on-click')
        // eslint-disable-next-line no-unused-vars
        for (const link of closeOnClick) {
          link.removeEventListener('click', this.closeOnClick)
          link.addEventListener('click', this.closeOnClick)
        }

        ref.style.position = 'absolute'
        ref.style.left = left
        ref.style.top = top
        ref.classList.add('pDropOpen')
      }
    }
  }

  render () {
    const {
      title,
      titleHref,
      showTitlebar,
      leftArrow,
      showArrow,
      override,
      topOffset,
      leftOffset,
      rightComponent,
      children,
      className,
      footerComponent,
      minHeight,
      minWidth,
      isListItems
    } = this.props
    return (
      <div
        id={this.props.id}
        ref={this.dropRef}
        className={clsx('p-dropdown', leftArrow && 'p-dropdown-left', !showArrow && 'p-dropdown-hide-arrow', className)}
        data-override={override}
        data-top-offset={topOffset}
        data-left-offset={leftOffset}
        style={{ minHeight, minWidth }}
      >
        {showTitlebar && (
          <div className='actions'>
            {titleHref && <a href={titleHref}>{title}</a>}
            {!titleHref && <span style={{ paddingLeft: '5px' }}>{title}</span>}
            {rightComponent && <div className='uk-float-right'>{rightComponent}</div>}
          </div>
        )}
        {isListItems && (
          <div className='items close-on-click'>
            <ul>{children}</ul>
          </div>
        )}
        {!isListItems && <div>{children}</div>}
        {footerComponent && (
          <div
            className={'bottom-actions actions uk-float-left'}
            style={{ borderBottom: 'none', borderTop: '1px solid rgba(0,0,0,0.2)' }}
          >
            {footerComponent}
          </div>
        )}
      </div>
    )
  }
}

PDropDown.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string,
  titleHref: PropTypes.string,
  showTitlebar: PropTypes.bool,
  leftArrow: PropTypes.bool,
  showArrow: PropTypes.bool,
  override: PropTypes.bool,
  topOffset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  leftOffset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rightComponent: PropTypes.element,
  footerComponent: PropTypes.element,
  minHeight: PropTypes.number,
  minWidth: PropTypes.number,
  isListItems: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired
}

PDropDown.defaultProps = {
  showTitlebar: true,
  leftArrow: false,
  showArrow: true,
  override: false,
  topOffset: '0',
  leftOffset: '0',
  minHeight: 0,
  isListItems: true
}

export default PDropDown
