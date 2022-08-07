/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/29/19 12:43 AM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import SessionContext, { saveSession } from 'app/SessionContext'

import Button from 'components/Button'
import Form from 'components/Form'

import Log from '../../logger'
import helpers from 'lib/helpers'

import './login.styles.sass'
import pkg from '../../../../package.json'
import { Helmet } from 'react-helmet-async'
// import TitleContext from 'app/TitleContext'
import LoginBackground from '../../components/LoginBackground'
import $ from 'jquery'

const Login = ({ theme, common }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const userNameInput = React.createRef()

  useEffect(() => {
    helpers.UI.inputs()
    // helpers.UI.reRenderInputs()
    $.event.trigger('trudesk:ready', window)
    if (userNameInput.current) userNameInput.current.focus()
  }, [])

  return (
    <div style={{ overflow: 'auto' }}>
      {/*<TitleContext.Consumer>*/}
      {/*  {({ title }) => (*/}
      {/*    <Helmet>*/}
      {/*      <title>{title} Login - Powered by Trudesk</title>*/}
      {/*    </Helmet>*/}
      {/*  )}*/}
      {/*</TitleContext.Consumer>*/}
      {error && (
        <div
          className={'mb-15 uk-text-center'}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', background: '#d32f2f', padding: 15, zIndex: 99 }}
        >
          <span style={{ fontSize: '18px', color: 'white', fontWeight: 300 }}>{error}</span>
        </div>
      )}
      <LoginBackground />
      <div className='login-container'>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1
          }}
        >
          {/*{theme.customLogo && (*/}
          {/*  <img*/}
          {/*    src={`https://files.trudesk.io/${theme.customLogoUrl || 'defaultLogoDark.png'}`}*/}
          {/*    alt='Logo'*/}
          {/*    className='site-logo'*/}
          {/*    style={{ marginBottom: 45, zIndex: 1, maxWidth: 225 }}*/}
          {/*  />*/}
          {/*)}*/}
          {/*{!theme.customLogo && (*/}
          <svg className={'site-logo-login'} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 288.9 70.1'>
            <path d='M28.5 28.4c-.1 1.6-.7 3.4-1.6 5.4-2.4-.3-4.6-.4-6.8-.4h-1.7c-2.9 13.9-4.3 22.6-4.3 26.1 0 1.8.4 2.7 1.2 2.7.8 0 2.9-.8 6.2-2.3l1.7 3.1c-5.5 4.7-10.7 7-15.4 7-2.2 0-4-.7-5.4-2.1C1 66.5.3 64.7.3 62.4s.3-4.9.8-7.7c.5-2.9 1.3-6.4 2.2-10.6.9-4.2 1.6-7.5 2.1-10.1-2.3.2-4 .4-5.2.6-.1-.8-.2-1.8-.2-3 0-1.3.1-2.3.3-3.1h5.9c.5-3.4.8-6.6.8-9.6L6.8 16v-.3c4.9-1.7 9.5-2.5 13.8-2.5.2 1.3.4 2.8.4 4.7 0 1.9-.5 5.4-1.6 10.6h9.1zM29.6 69.1H29c-.1-.5-.2-1.6-.2-3.4 0-1.8.8-6.6 2.5-14.4 1.7-7.8 2.5-12.3 2.5-13.4 0-1.9-.9-4.1-2.6-6.4l-.8-1.1.1-1.2c3.4-.9 8.8-1.4 16.2-1.4.8 1.6 1.1 3.9 1.1 6.8.7-1.1 2.1-2.6 4.3-4.5 2.2-1.9 4.4-2.8 6.8-2.8 3.4 0 5.1 2.9 5.1 8.8-.3.4-.7.9-1.3 1.5-.5.6-1.6 1.4-3.2 2.5s-3.1 1.7-4.6 2c-.1 0-.6-.8-1.6-2.5s-1.8-2.5-2.3-2.5c-1.6.6-2.9 1.5-4.1 2.8C44 52.8 42.6 61.2 42.6 65c0 1.4 0 2.3.1 2.9-2.2.8-6.5 1.2-13.1 1.2z' />
            <path d='M62.7 61.8c0-2.7.8-7.2 2.4-13.7 1.6-6.5 2.4-10.4 2.4-11.9s-1.1-3.4-3.4-5.9l.1-1.2c4.3-.9 9.9-1.3 16.8-1.3.3.8.5 2.3.5 4.4 0 2.1-.9 6.7-2.6 13.6-1.8 6.9-2.6 11.3-2.6 12.9s.6 2.5 1.9 2.5c1.8 0 3.9-.7 6.3-2 .3-1.5.9-4.4 1.9-8.6 2.3-10 3.4-17.2 3.4-21.5 2.2-.9 6.1-1.3 11.8-1.3h1.8c0 2.9-.9 8.7-2.6 17.2-1.8 8.5-2.6 13.5-2.6 15s.3 2.2.9 2.2c.4 0 2.2-.8 5.3-2.3l1.8 3c-5.6 4.6-10.4 6.9-14.6 6.9-2 0-3.7-.6-5.1-1.7-1.4-1.1-2.2-2.6-2.4-4.4-5.1 4.1-9.7 6.2-13.8 6.2-2.2 0-4-.7-5.4-2.2-1.5-1.2-2.2-3.3-2.2-5.9zM153.2 63.1c-5.3 4.6-10 6.8-14 6.8s-6.4-2-7-6c-1.9 1.9-4 3.3-6.3 4.4-2.3 1.1-4.3 1.6-6.1 1.6-3 0-5.6-1.3-7.7-3.9-2.1-2.6-3.2-6.7-3.2-12.2 0-8.3 1.8-14.7 5.3-19.5 3.5-4.7 7.5-7.1 11.9-7.1s8.1 1 11.1 3c1.9-10.1 2.9-18.1 2.9-23.9l-.5-3.9C144.3.8 148.9 0 153.4 0c.5 1.1.8 2.3.8 3.7 0 4.6-1.4 13.8-4.1 27.8-2.8 14-4.1 23.5-4.1 28.5 0 1.5.3 2.3 1 2.3.4 0 1.6-.6 3.6-1.8l.9-.6 1.7 3.2zm-22.6-30.3c-2.2 0-4.1 2.2-5.7 6.5-1.6 4.3-2.4 8.6-2.4 12.8 0 4.2.3 6.9.9 8.1.6 1.2 1.5 1.8 2.7 1.8 2.1 0 4.1-.8 6.1-2.5.2-2.5 1.6-10.8 4.2-25-2.1-1.1-4.1-1.7-5.8-1.7zM155.5 52.6c0-7.8 2.4-14 7.1-18.5 4.7-4.5 10.1-6.8 16.1-6.8 3.7 0 6.7.9 9.1 2.7 2.4 1.8 3.6 4.2 3.6 7.3 0 3-.8 5.6-2.3 7.6-1.5 2.1-3.4 3.7-5.6 4.8-4.4 2.2-8.5 3.6-12.2 4.1l-2.3.3c.4 5.9 2.8 8.8 7.2 8.8 1.5 0 3.1-.4 4.8-1.1 1.7-.8 3-1.5 3.9-2.3l1.4-1.1 2.3 3c-.5.7-1.5 1.6-3 2.7s-2.9 2.1-4.2 2.8c-3.6 2-7.6 3-11.9 3-4.3 0-7.7-1.5-10.2-4.6-2.6-3-3.8-7.2-3.8-12.7zm21-7.1c1.9-2.1 2.8-4.9 2.8-8.3 0-3.4-1-5.1-3-5.1-2.4 0-4.2 2-5.5 6.1-1.3 4-1.9 7.8-1.9 11.3 3.2-.5 5.7-1.9 7.6-4zM223.2 56.6c0 3.9-1.7 7.2-5.2 9.7-3.5 2.5-7.4 3.8-11.9 3.8-4.4 0-8-.9-10.6-2.8-2.6-1.9-3.9-3.5-3.9-5 0-.9 1.1-2.3 3.3-4.3 2.2-2 4-3.2 5.5-3.6 3.1 2.3 5.7 6 7.7 11 2.3-.2 3.5-1.3 3.5-3.3 0-2.9-2.5-7-7.6-12.2-5.1-5.3-7.6-9.5-7.6-12.6 0-3.1 1.4-5.5 4.2-7.3 2.8-1.7 6.2-2.6 10.2-2.6 4 0 7 .7 9 2.1 2 1.4 3 3.3 3 5.7 0 2.4-1.9 5.7-5.7 10l1.7 1.7c.7.7 1.6 2.1 2.7 4.1 1.1 1.9 1.7 3.8 1.7 5.6zm-5.1-21.4c0-2.2-1.5-3.3-4.5-3.3-1.4 0-2.6.3-3.6.9-.9.6-1.4 1.3-1.4 2 0 1.4 1.4 3.3 4.1 5.8l1.4 1.2c2.7-2.2 4-4.4 4-6.6zM238.1 6.9c0-2.1-.2-3.5-.6-4.4C242.4.8 247 0 251.3 0c.6.6.8 2 .8 4.3 0 5.2-1.7 15.1-5.2 29.8 5.6-4.6 11.1-6.8 16.5-6.8 2.4 0 4.5.8 6.2 2.3 1.7 1.5 2.5 3.7 2.5 6.6 0 5.4-4.4 9.3-13.2 11.7 2.1 6.5 3.9 10.9 5.4 13.2.7 1 1.2 1.5 1.5 1.5.7 0 2.1-.5 4.3-1.6l1-.5 1.5 3.2c-1.5 1.4-3.6 2.8-6.2 4.2-2.7 1.4-5.1 2.1-7.3 2.1-4.9 0-8.3-4.4-10.2-13.3-.9-3.8-1.4-7.4-1.6-10.7 4-.9 7-2.1 9-3.4 2-1.3 3-3.1 3-5.2s-1.1-3.1-3.2-3.1-5.7 2.1-10.7 6.4c-3.1 13.2-4.7 22.2-4.7 27.1-3.4 1-7.9 1.5-13.4 1.5-.1-1.1-.1-2-.1-2.8 0-2.7 1.8-11.9 5.4-27.6 3.7-15.8 5.5-26.4 5.5-32z' />
            <circle cx='284.9' cy='64.7' r='4' fill='var(--tertiary)' />
          </svg>
          {/*)}*/}
          <div className='login-wrapper' style={{ background: 'var(--pagecontentlight10)' }}>
            <h2 className='uk-text-left font-light uk-margin-large-bottom'>Sign into your account</h2>
            <div className='loginForm'>
              <SessionContext.Consumer>
                {({ setSession }) => (
                  <Form
                    id='loginForm'
                    className='uk-form-stacked uk-clearfix'
                    url={'/api/v2/login'}
                    method={'post'}
                    data={{ username, password }}
                    onCompleted={({ data }) => {
                      setError('')
                      setSession(saveSession(data))
                    }}
                    onError={err => {
                      if (err.response && err.response.data) setError(err.response.data.error)
                      else setError('Invalid Login')

                      Log.error(error)
                    }}
                  >
                    <div className='uk-margin-medium-bottom'>
                      <label htmlFor='username'>Username</label>
                      <input
                        id='username'
                        className='md-input'
                        type='text'
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        ref={userNameInput}
                      />
                    </div>
                    <div className='uk-margin-medium-bottom'>
                      <label htmlFor='password'>Password</label>
                      <input
                        id='password'
                        className='md-input md-waves-light'
                        type='password'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                    <Button flat={false} waves={true} text={'LOGIN'} type={'submit'} extraClass={'btn md-btn-accent'} />
                  </Form>
                )}
              </SessionContext.Consumer>
            </div>
            <div
              style={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap'
              }}
            >
              <hr style={{ width: '100%' }} />
              {common.allowUserRegistration && (
                <Link to={`/signup`} style={{ float: 'left' }}>
                  Create an account
                </Link>
              )}
              <Link to={`/forgotpassword`} className='right' style={{ display: 'block', clear: 'right' }}>
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
        <div className='thebottom'>
          <span>© Trudesk</span>
          <span>
            <a href='mailto:support@trudesk.io'>Contact</a>
          </span>
          <span>
            <a href={'https://trudesk.io/privacy-policy/'}>Privacy Policy</a>
          </span>
        </div>
      </div>
    </div>
  )
}

Login.propTypes = {
  theme: PropTypes.object
}

const mapStateToProps = state => ({
  theme: state.theme,
  common: state.common
})

export default connect(mapStateToProps, null)(Login)
