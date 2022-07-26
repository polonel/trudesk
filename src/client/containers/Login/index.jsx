import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { StyleSheet, css } from 'aphrodite'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'
import Input from 'components/Input'
import Button from 'components/Button'
import axios from 'axios'
import 'history'
import $ from 'jquery'
import ForgotPasswordContainer from 'containers/Login/forgotPassword'
import clsx from 'clsx'

const GLOBALS = '__GLOBAL_STYLES__'

const globalExtension = {
  selectorHandler: (selector, baseSelector, generateSubtreeStyles) =>
    baseSelector.includes(GLOBALS) ? generateSubtreeStyles(selector) : null,
}

const extended = StyleSheet.extend([globalExtension])

@observer
class LoginContainer extends React.Component {
  @observable flashSuccess = false
  @observable flashMessage = ''
  @observable subFlash = ''
  @observable username = ''
  @observable password = ''

  @observable pageLogo = '/img/defaultLogoDark.png'
  @observable allowUserRegistration = false

  loginFormRef = createRef()
  forgotPasswordRef = createRef()

  constructor(props) {
    super(props)
    makeObservable(this)
  }

  componentDidMount() {
    setTimeout(function () {
      $('#login-username').focus()
    }, 700)

    axios
      .get('/api/v2/viewdata')
      .then((res) => {
        const viewData = res.data.viewdata
        if (viewData.hasCustomPageLogo && viewData.customPageLogoFilename)
          this.pageLogo = viewData.customPageLogoFilename
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(error)
      })
  }

  onShowForgotPassword(e) {
    e.preventDefault()
    if (this.loginFormRef.current && this.forgotPasswordRef.current) {
      const $loginForm = $(this.loginFormRef.current)
      const $forgotPasswordForm = $(this.forgotPasswordRef.current)

      $loginForm.fadeOut(100, () => {
        $forgotPasswordForm.fadeIn()
      })
    }
  }

  onForgotPasswordComplete(err, result) {
    if (err) {
      this.flashSuccess = false
      this.flashMessage = err
    } else {
      this.flashMessage = 'Password Rest Email Sent.'
      this.subFlash = 'Please follow the direction in the email'
      this.flashSuccess = true
      this.onBackClicked()
    }
  }

  onLoginFormSubmit(e) {
    e.preventDefault()
    if (this.username.length < 4 || this.password.length < 4) return

    const params = new URLSearchParams()
    params.append('login-username', this.username)
    params.append('login-password', this.password)

    axios
      .post('/login', {
        'login-username': this.username,
        'login-password': this.password,
      })
      .then((res) => {
        if (res.data?.success && res.data?.redirectUrl) {
          this.flashSuccess = false
          this.flashMessage = ''
          this.subFlash = ''
          return (window.location.href = res.data.redirectUrl)
        }
      })
      .catch((err) => {
        if (err.response) {
          const response = err.response
          if (response.status === 429) {
            this.flashSuccess = false
            this.flashMessage = 'Too Many Requests'
            this.subFlash = `retry in ${err.response?.data?.timeout} seconds`
          } else if (response.status === 401 && response.data?.flash) {
            this.flashSuccess = false
            this.flashMessage = err.response.data.flash
            this.subFlash = ''
          }
        }
      })
  }

  onBackClicked() {
    if (this.loginFormRef.current && this.forgotPasswordRef.current) {
      const $loginForm = $(this.loginFormRef.current)
      const $forgotPasswordForm = $(this.forgotPasswordRef.current)

      $forgotPasswordForm.fadeOut(100, () => {
        $loginForm.fadeIn()
      })
    }
  }

  render() {
    const { aur, me } = this.props
    return (
      <div>
        {this.flashMessage && (
          <div className={clsx('alert-message', this.flashSuccess && 'green')}>
            <p>
              {this.flashMessage}
              {this.subFlash && (
                <span style={{ display: 'block', fontSize: '13px', marginBottom: 5 }}>{this.subFlash}</span>
              )}
            </p>
          </div>
        )}

        <div className="login-wrapper">
          <img src={this.pageLogo} alt="Logo" className="site-logo-login" />

          <div ref={this.loginFormRef} className="loginForm">
            <form id="loginForm" className="uk-form-stacked uk-clearfix" onSubmit={(e) => this.onLoginFormSubmit(e)}>
              <div className="uk-margin-medium-bottom">
                <div className="uk-margin-medium-bottom">
                  <Input
                    type={'text'}
                    name={'login-username'}
                    id={'login-username'}
                    showLabel={true}
                    labelText={'Username'}
                    onChange={(val) => (this.username = val)}
                  />
                </div>
              </div>
              <div className="uk-margin-medium-bottom">
                <Input
                  type={'password'}
                  name={'login-password'}
                  id={'login-password'}
                  showLabel={true}
                  labelText={'Password'}
                  onChange={(val) => (this.password = val)}
                />
              </div>
              <Button type={'submit'} text={'login'} flat={true} waves={true} style={'accent'} extraClass={'btn'} />
            </form>
            {aur === 'true' || (me === 'true' && <hr />)}
            {aur === 'true' && (
              <a href="/signup" className="no-ajaxy left">
                Create an Account
              </a>
            )}
            {me === 'true' && (
              <a href="#" className="no-ajaxy right" onClick={(e) => this.onShowForgotPassword(e)}>
                Forgot your password?
              </a>
            )}
          </div>

          <ForgotPasswordContainer
            forwardRef={this.forgotPasswordRef}
            onBackClicked={(e) => this.onBackClicked(e)}
            onCompleted={(err, result) => this.onForgotPasswordComplete(err, result)}
          />
        </div>

        <div className="bottom">Trudesk v1.2.5-CE</div>
      </div>
    )
  }
}

const globalStyles = extended.StyleSheet.create({
  [GLOBALS]: {},
})

extended.css(globalStyles[GLOBALS])

const styles = StyleSheet.create({
  body: {
    background: 'blue',
  },
  red: {
    background: 'red',
  },
})

LoginContainer.propTypes = {
  aur: PropTypes.string,
  me: PropTypes.string,
}

export default LoginContainer
