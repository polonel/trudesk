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
 *  Updated:    2/6/19 12:30 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import BaseModal from './BaseModal'
import Button from 'components/Button'

import { hideModal } from 'actions/common'

class LinkWarningModal extends React.Component {
  proceedToLink = (e, link) => {
    e.preventDefault()
    this.props.hideModal()
    setTimeout(() => {
      window.open(link, '_blank')
    }, 300)
  }

  render () {
    return (
      <BaseModal>
        <div>
          <h2>Redirect Warning</h2>
          <p>You are being redirected to a site outside this domain. Proceed with caution.</p>
          <p>
            <strong>{this.props.href}</strong>
          </p>
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Cancel'} extraClass={'uk-modal-close'} flat={true} waves={true} />
          <Button
            text={'Proceed'}
            type={'submit'}
            flat={true}
            waves={true}
            style={'danger'}
            onClick={e => this.proceedToLink(e, this.props.href)}
          />
        </div>
      </BaseModal>
    )
  }
}

LinkWarningModal.propTypes = {
  hideModal: PropTypes.func.isRequired,
  href: PropTypes.string.isRequired
}

export default connect(null, { hideModal })(LinkWarningModal)
