import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import BaseModal from './BaseModal'
import Button from 'components/Button'

import { createTag } from 'actions/tickets'

function CreateTagModal ({ createTag, page, currentPage }) {
  const [name, setName] = useState('')

  const onSubmit = e => {
    e.preventDefault()
    if (page === 'settings') return createTag({ name, currentPage })
    createTag({ name })
  }

  return (
    <BaseModal>
      <form className='uk-form-stacked' onSubmit={onSubmit}>
        <div>
          <h2 className={'nomargin mb-5'}>Create Tag</h2>
          <p className='uk-text-muted'>Tags categorize tickets, making it easy to identify issues</p>

          <label>Tag Name</label>
          <input
            type='text'
            className={'md-input'}
            name={'name'}
            data-validation='length'
            data-validation-length='min2'
            data-validation-error-msg='Please enter a valid tag name. Tag name must contain at least 2 characters.'
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className='uk-modal-footer uk-text-right'>
          <Button text={'Close'} extraClass={'uk-modal-close'} flat={true} waves={true} />
          <Button text={'Create'} type={'submit'} flat={true} waves={true} style={'success'} />
        </div>
      </form>
    </BaseModal>
  )
}

CreateTagModal.propTypes = {
  createTag: PropTypes.func.isRequired,
  page: PropTypes.string,
  currentPage: PropTypes.number
}

export default connect(null, { createTag })(CreateTagModal)
