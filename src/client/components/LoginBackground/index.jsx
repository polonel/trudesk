/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    4/5/20, 4:49 PM
 *  Copyright (c) 2020 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'

class LoginBackground extends React.Component {
  render () {
    return (
      <div className='login-background'>
        <div
          className={'bg-dot'}
          style={{
            top: -500,
            left: -500,
            width: 1000,
            height: 1000,
            background: 'rgba(0,0,0,0.025)'
          }}
        />
        <div
          className={'bg-dot'}
          style={{
            top: 24,
            left: 50,
            width: 50,
            height: 50,
            background: 'rgba(0,0,0,0.05)'
          }}
        />
        <div
          className={'bg-dot'}
          style={{
            top: 50,
            left: 100,
            width: 100,
            height: 100,
            opacity: 0.45,
            background: 'var(--tertiaryfade)'
          }}
        />
        <div
          className={'bg-dot'}
          style={{
            top: 125,
            left: 250,
            width: 75,
            height: 75,
            background: 'rgba(0,0,0,0.09)'
          }}
        />
        <div
          className={'bg-dot'}
          style={{
            top: 185,
            left: 130,
            width: 95,
            height: 95,
            boxShadow: 'inset 0 0 2px rgba(0,0,0,0.2)'
          }}
        />
        <div
          className={'bg-dot'}
          style={{
            bottom: 50,
            right: 50,
            width: 175,
            height: 175,
            background: 'rgba(0,0,0,0.035)'
          }}
        />
        <div
          className={'bg-dot'}
          style={{
            bottom: 250,
            right: 175,
            width: 105,
            height: 105,
            boxShadow: 'inset 0 0 2px rgba(0,0,0,0.5)'
          }}
        />
        <div
          className={'bg-dot'}
          style={{
            bottom: 230,
            right: 100,
            width: 65,
            height: 65,
            // opacity: 0.7,
            boxShadow: 'inset 0 0 2px var(--tertiary)'
          }}
        />
        <div
          className={'bg-dot'}
          style={{
            bottom: 125,
            right: 240,
            width: 100,
            height: 100,
            opacity: 0.5,
            background: 'var(--tertiaryfade)'
          }}
        />
      </div>
    )
  }
}

LoginBackground.propTypes = {}

export default LoginBackground
