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

import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import $ from 'jquery'
import UIKit from 'uikit'

import { hideModal, clearModal } from 'actions/common'

function BaseModal ({ large, options, modalTag, clearModal, parentExtraClass, extraClass, children }) {
  const modalRef = useRef(null)
  const uikitModalRef = useRef(null)

  useEffect(() => {
    uikitModalRef.current = UIKit.modal(modalRef.current, options)
    uikitModalRef.current.show()

    const onHide = () => clearModal()
    $(modalRef.current).on('hide.uk.modal', onHide)
    return () => $(modalRef.current).off('hide.uk.modal', onHide)
  }, [])

  return (
    <div
      id={'uk-modal'}
      className={'uk-modal' + (parentExtraClass ? ' ' + parentExtraClass : '')}
      ref={modalRef}
      data-modal-tag={modalTag}
    >
      <div
        className={
          'uk-modal-dialog' +
          (large ? ' uk-modal-dialog-large' : '') +
          (extraClass ? ' ' + extraClass : '')
        }
      >
        {children}
      </div>
    </div>
  )
}

BaseModal.propTypes = {
  large: PropTypes.bool,
  options: PropTypes.object,
  modalTag: PropTypes.string,
  clearModal: PropTypes.func.isRequired,
  parentExtraClass: PropTypes.string,
  extraClass: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired
}

export default connect(null, { hideModal, clearModal })(BaseModal)
