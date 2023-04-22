import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import Slide from 'containers/Install/Slides/Slide'
import helpers from 'containers/Install/install-helpers'

const CreateAdminSlide = forwardRef(({ slidesEl, onValid }, ref) => {
  const adminUsernameField = useRef()
  const adminNameField = useRef()
  const adminPasswordField = useRef()
  const adminConfirmPasswordField = useRef()
  const adminEmailField = useRef()

  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  useImperativeHandle(ref, () => ({
    getValues
  }))

  const getValues = () => {
    return {
      adminUsername,
      adminPassword,
      adminConfirmPassword,
      adminName,
      adminEmail
    }
  }

  const setFormError = ref => {
    const errorClasses = ['bottom-fix', 'error-color']

    ref.current?.parentElement.classList.add('has-error')
    ref.current?.parentElement.querySelector('.md-input-bar').classList.add(...errorClasses)
    ref.current?.classList.add('uk-form-danger')
  }

  const clearFormError = ref => {
    const errorClasses = ['bottom-fix', 'error-color']

    ref.current?.parentElement.classList.remove('has-error')
    ref.current?.parentElement.querySelector('.md-input-bar').classList.remove(...errorClasses)
    ref.current?.classList.remove('uk-form-danger')
  }

  const setupAdminAccount = e => {
    if (helpers.isDoubleClicked(e.target)) return

    let usernameValid = false,
      nameValid = false,
      passwordValid = false,
      confirmPasswordValid = false,
      emailValid = false

    if (!adminUsername || adminUsername.length < 4) setFormError(adminUsernameField)
    else {
      clearFormError(adminUsernameField)
      usernameValid = true
    }

    if (!adminName || adminName.length < 1) setFormError(adminNameField)
    else {
      clearFormError(adminNameField)
      nameValid = true
    }

    if (!adminPassword || adminPassword.length < 4) setFormError(adminPasswordField)
    else {
      clearFormError(adminPasswordField)

      passwordValid = true
    }

    if (!adminConfirmPassword || adminConfirmPassword !== adminPassword) setFormError(adminConfirmPasswordField)
    else {
      clearFormError(adminConfirmPasswordField)
      confirmPasswordValid = true
    }

    if (!adminEmail || !helpers.validateEmail(adminEmail)) setFormError(adminEmailField)
    else {
      clearFormError(adminEmailField)
      emailValid = true
    }

    if (!usernameValid || !nameValid || !passwordValid || !confirmPasswordValid || !emailValid) return

    slidesEl.current?.showSlideWithId('installingSlide')

    setTimeout(() => {
      if (onValid) onValid()
    }, 3000)
  }

  return (
    <Slide>
      <h2 style={{ marginBottom: 25 }}>Setup Account</h2>
      <p style={{ textAlign: 'left' }}>Now that we got you connected, its time to create an Administrator.</p>

      <form id='adminAccount' className='uk-form-stacked uk-clearfix'>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='admin-username'>Username</label>
          <input
            type='text'
            ref={adminUsernameField}
            className='md-input'
            value={adminUsername}
            onChange={e => setAdminUsername(e.target.value)}
          />
        </div>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='admin-fullname'>Full Name</label>
          <input
            type='text'
            ref={adminNameField}
            className='md-input'
            value={adminName}
            onChange={e => setAdminName(e.target.value)}
          />
        </div>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='admin-password'>Password</label>
          <input
            type='password'
            ref={adminPasswordField}
            className='md-input'
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
          />
        </div>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='admin-cpassword'>Confirm Password</label>
          <input
            type='password'
            ref={adminConfirmPasswordField}
            className='md-input'
            value={adminConfirmPassword}
            onChange={e => setAdminConfirmPassword(e.target.value)}
          />
        </div>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='admin-email'>Email</label>
          <input
            type='email'
            ref={adminEmailField}
            className='md-input'
            value={adminEmail}
            onChange={e => setAdminEmail(e.target.value)}
          />
        </div>

        <button className='btn md-btn md-btn-wave md-btn-primary' type='button' onClick={e => setupAdminAccount(e)}>
          Create Admin
        </button>
      </form>
    </Slide>
  )
})

CreateAdminSlide.propTypes = {
  slidesEl: PropTypes.any,
  onValid: PropTypes.func
}

CreateAdminSlide.displayName = 'CreateAdminSlide'

export default CreateAdminSlide
