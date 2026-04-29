import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { hideModal } from 'actions/common'

import Input from 'components/Input'
import Button from 'components/Button'
import BaseModal from 'containers/Modals/BaseModal'

import axios from 'api/axios'
import helpers from 'lib/helpers'

function PasswordPromptModal ({ titleOverride, textOverride, hideModal, onVerifyComplete }) {
  const [confirmPassword, setConfirmPassword] = useState('')
  const passwordRef = useRef(null)

  useEffect(() => {
    if (passwordRef.current) {
      helpers.UI.inputs()
      setTimeout(() => {
        passwordRef.current.focus()
      }, 250)
    }
  }, [])

  const onVerifyPassword = e => {
    e.preventDefault()

    axios
      .post('/api/v2/accounts/profile/mfa/disable', { confirmPassword })
      .then(() => {
        hideModal()
        if (onVerifyComplete) onVerifyComplete(true)
      })
      .catch(error => {
        let errMessage = 'An Error has occurred.'
        if (error.response && error.response.data && error.response.data.error) errMessage = error.response.data.error

        helpers.UI.showSnackbar(errMessage, true)

        if (onVerifyComplete) onVerifyComplete(false)
      })
  }

  return (
    <BaseModal options={{ bgclose: false }}>
      <div>
        <h2>{titleOverride || 'Confirm Password'}</h2>
        <p>{textOverride || 'Please confirm your password.'}</p>
      </div>
      <div className={'uk-margin-medium-bottom'}>
        <label>Current Password</label>
        <Input
          innerRef={passwordRef}
          name={'current-password'}
          type={'password'}
          onChange={val => setConfirmPassword(val)}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button text={'Cancel'} small={true} flat={true} waves={false} onClick={() => hideModal()} />
        <Button
          text={'Verify Password'}
          style={'primary'}
          small={true}
          waves={true}
          onClick={onVerifyPassword}
        />
      </div>
    </BaseModal>
  )
}

PasswordPromptModal.propTypes = {
  user: PropTypes.object.isRequired,
  titleOverride: PropTypes.string,
  textOverride: PropTypes.string,
  onVerifyComplete: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired
}

export default connect(null, { hideModal })(PasswordPromptModal)
