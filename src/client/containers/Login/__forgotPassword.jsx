import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import Button from 'components/Button'
import Input from 'components/Input'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'

import axios from 'axios'
import helpers from 'lib/helpers'
import $ from 'jquery'

@observer
class ForgotPasswordContainer extends React.Component {
  @observable email = ''
  @observable pending = false

  constructor (props) {
    super(props)

    makeObservable(this)
  }

  componentDidMount () {
    // helpers.UI.reRenderInputs()
    $.event.trigger('trudesk:ready', window)
  }

  onFormSubmit (e) {
    e.preventDefault()
    if (this.props.onBeforeSubmit) this.props.onBeforeSubmit()
    this.pending = true
    axios
      .post('/forgotpass', {
        email: this.email
      })
      .then(res => {
        this.email = ''
        if (this.props.onCompleted) this.props.onCompleted(null, res.data)
        this.pending = false
      })
      .catch(err => {
        if (this.props.onCompleted) this.props.onCompleted(err)
        this.pending = false
      })
  }

  render () {
    const { forwardRef } = this.props
    return (
      <div ref={forwardRef}>
        <div className='forgotPassForm'>
          <form onSubmit={e => this.onFormSubmit(e)}>
            <div className='uk-margin-medium-bottom'>
              <Input
                type={'text'}
                showLabel={true}
                labelText={'Email'}
                name={'forgotPass-email'}
                id={'forgotPass-email'}
                onChange={val => (this.email = val)}
              />
            </div>
            <Button
              text={'Forgot Password'}
              flat={true}
              waves={true}
              style={'danger'}
              type={'submit'}
              extraClass={'btn'}
              disabled={this.pending}
            />
          </form>

          <a
            id='backToLogin'
            href='#'
            className='no-ajaxy'
            onClick={e => {
              e.preventDefault()
              if (this.props.onBackClicked) this.props.onBackClicked(e)
            }}
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }
}

ForgotPasswordContainer.propTypes = {
  forwardRef: PropTypes.any,
  onBackClicked: PropTypes.func,
  onBeforeSubmit: PropTypes.func,
  onCompleted: PropTypes.func
}

export default ForgotPasswordContainer
