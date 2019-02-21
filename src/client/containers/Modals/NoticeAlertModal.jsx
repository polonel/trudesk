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
 *  Updated:    2/20/19 12:32 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { hideModal } from 'actions/common'

import Button from 'components/Button'
import BaseModal from 'containers/Modals/BaseModal'

import helpers from 'lib/helpers'
import Cookies from 'jscookie'

class NoticeAlertModal extends React.Component {
  onConfirmClick (e) {
    e.preventDefault()

    // Set Cookie
    const expiresDate = new Date()
    expiresDate.setDate(expiresDate.getDate() + 1)
    Cookies.set(this.props.noticeCookieName, 'false', { expires: expiresDate })
    this.props.hideModal('NOTICE_ALERT')
  }

  render () {
    const { notice, shortDateFormat, timeFormat } = this.props
    const dateFormat = shortDateFormat + ', ' + timeFormat
    return (
      <BaseModal {...this.props} options={{ bgclose: false }} large={true}>
        <div>
          <div
            style={{
              width: '100%',
              height: '50px',
              backgroundColor: notice.color,
              marginBottom: '5px',
              position: 'absolute',
              top: 0,
              left: 0,
              padding: '7px 25px'
            }}
          >
            <h4 style={{ fontSize: '24px', marginTop: '7px', fontWeight: '300', color: notice.fontColor }}>
              {notice.name}
            </h4>
          </div>
          <div style={{ paddingBottom: '25px' }}>
            <p style={{ marginTop: '50px', color: '#222', fontSize: '18px', paddingBottom: '15px' }}>
              {helpers.formatDate(notice.activeDate, dateFormat)}
              <br />
              Important: {notice.message}
            </p>
            <Button
              text={'Confirm'}
              flat={true}
              style={'success'}
              extraClass={'uk-float-right'}
              styleOverride={{ marginBottom: 0 }}
              waves={true}
              onClick={e => this.onConfirmClick(e)}
            />
          </div>
        </div>
      </BaseModal>
    )
  }
}

NoticeAlertModal.propTypes = {
  notice: PropTypes.object.isRequired,
  noticeCookieName: PropTypes.string.isRequired,
  shortDateFormat: PropTypes.string.isRequired,
  timeFormat: PropTypes.string.isRequired,
  hideModal: PropTypes.func.isRequired
}

export default connect(
  null,
  { hideModal }
)(NoticeAlertModal)
