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
 *  Updated:    2/3/19 8:15 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import $ from 'jquery'
import UIKit from 'uikit'

import { hideModal, clearModal } from 'actions/common'

class BaseModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      modal: null
    }
    this.clearModal = this.clearModal.bind(this)
  }

  componentDidMount () {
    this.setState(
      {
        modal: UIKit.modal(this.modal, this.props.options)
      },
      () => {
        this.state.modal.show()
        $(this.modal).on('hide.uk.modal', this.clearModal)
      }
    )
  }

  show () {
    if (this.state.modal) this.state.modal.show()
  }

  hide () {
    this.props.hideModal()
  }

  clearModal () {
    this.props.clearModal()
  }

  render () {
    return (
      <div
        id={'uk-modal'}
        className={'uk-modal' + (this.props.parentExtraClass ? ' ' + this.props.parentExtraClass : '')}
        ref={i => (this.modal = i)}
        data-modal-tag={this.props.modalTag}
      >
        <div
          className={
            'uk-modal-dialog' +
            (this.props.large ? ' uk-modal-dialog-large' : '') +
            (this.props.extraClass ? ' ' + this.props.extraClass : '')
          }
        >
          {this.props.children}
        </div>
      </div>
    )
  }
}

BaseModal.propTypes = {
  large: PropTypes.bool,
  options: PropTypes.object,
  modalTag: PropTypes.string,
  hideModal: PropTypes.func.isRequired,
  clearModal: PropTypes.func.isRequired,
  parentExtraClass: PropTypes.string,
  extraClass: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired
}

export default connect(
  null,
  { hideModal, clearModal }
)(BaseModal)
