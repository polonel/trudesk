import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { observable } from 'mobx'

import { hideModal } from 'actions/common'

import Input from 'components/Input'
import Button from 'components/Button'
import BaseModal from 'containers/Modals/BaseModal'

import axios from 'api/axios'
import helpers from 'lib/helpers'

@observer
class PasswordPromptModal extends React.Component {
  @observable confirmPassword = ''

  constructor (props) {
    super(props)
    this.passwordRef = createRef()
  }

  componentDidMount () {
    if (this.passwordRef.current) {
      helpers.UI.inputs()
      setTimeout(() => {
        this.passwordRef.current.focus()
      }, 250)
    }
  }

  onVerifyPassword = e => {
    e.preventDefault()

    axios
      .post('/api/v2/accounts/profile/mfa/disable', {
        confirmPassword: this.confirmPassword
      })
      .then(res => {
        this.props.hideModal()

        if (this.props.onVerifyComplete) this.props.onVerifyComplete(true)
      })
      .catch(error => {
        let errMessage = 'An Error has occurred.'
        if (error.response && error.response.data && error.response.data.error) errMessage = error.response.data.error

        helpers.UI.showSnackbar(errMessage, true)

        if (this.props.onVerifyComplete) this.props.onVerifyComplete(false)
      })
  }

  render () {
    const { titleOverride, textOverride } = this.props
    return (
      <BaseModal options={{ bgclose: false }}>
        <div>
          <h2>{titleOverride || 'Confirm Password'}</h2>
          <p>{textOverride || 'Please confirm your password.'}</p>
        </div>
        <div className={'uk-margin-medium-bottom'}>
          <label>Current Password</label>
          <Input
            innerRef={this.passwordRef}
            name={'current-password'}
            type={'password'}
            onChange={val => (this.confirmPassword = val)}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button text={'Cancel'} small={true} flat={true} waves={false} onClick={() => this.props.hideModal()} />
          <Button
            text={'Verify Password'}
            style={'primary'}
            small={true}
            waves={true}
            onClick={e => this.onVerifyPassword(e)}
          />
        </div>
      </BaseModal>
    )
  }
}

PasswordPromptModal.propTypes = {
  user: PropTypes.object.isRequired,
  titleOverride: PropTypes.string,
  textOverride: PropTypes.string,
  onVerifyComplete: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired
}

const mapStateToProps = state => ({})

export default connect(mapStateToProps, { hideModal })(PasswordPromptModal)
