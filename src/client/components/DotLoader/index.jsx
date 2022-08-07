/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    7/7/19 8:02 PM
 *  Copyright (c) 2019 Trudesk, Inc. All rights reserved.
 */

import React, { createRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import $ from 'jquery'

const DotLoader = ({ active, animate }) => {
  const loaderRef = createRef()

  useEffect(() => {
    if (!active && animate) {
      if (loaderRef.current) {
        const $dotLoader = $(loaderRef.current)
        $dotLoader.animate({ opacity: 0 }, 500, () => {
          $dotLoader.hide()
        })
      }
    }
  }, [active])

  return (
    <div
      ref={loaderRef}
      className={clsx('loader-wrapper', !active && !animate && 'hide')}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        width: '100vw',
        zIndex: 99999999
      }}
    >
      <div className='shadow-wrapper'>
        <svg className='shadow'>
          <defs>
            <radialGradient r='0.5' cy='0.5' cx='0.5' id='bigdotshadow'>
              <stop stopColor='#000000' offset='0' />
              <stop stopOpacity='0' stopColor='#000000' offset='1' />
            </radialGradient>
          </defs>
          <ellipse
            className='shadow'
            opacity='0.2'
            ry='6'
            rx='10'
            id='svg_1'
            cy='65'
            cx='103'
            strokeLinecap='null'
            strokeLinejoin='null'
            strokeWidth='0'
            stroke='#000000'
            fill='url(#bigdotshadow)'
          />
        </svg>
      </div>
      <div className='test-wrapper'>
        <svg
          id='t'
          className='bigdot'
          style={{ width: 140, height: 75 }}
          viewBox='0 0 288.9 70.1'
          preserveAspectRatio='xMidYMid meet'
        >
          <g id='g' style={{ width: '100%', height: '100%' }}>
            <circle className='s1' cx='35.9' cy='82' r='10' />
          </g>
        </svg>
      </div>
    </div>
  )
}

DotLoader.propTypes = {
  active: PropTypes.bool.isRequired,
  animate: PropTypes.bool.isRequired
}

DotLoader.defaultProps = {
  active: false,
  animate: true
}

export default DotLoader
