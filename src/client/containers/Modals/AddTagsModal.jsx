import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { getTagsWithPage } from 'actions/tickets'
import { showModal, hideModal } from 'actions/common'

import BaseModal from 'containers/Modals/BaseModal'
import Button from 'components/Button'
import Log from '../../logger'
import axios from 'api/axios'
import $ from 'jquery'
import helpers from 'lib/helpers'

import { TICKETS_UI_TAGS_UPDATE } from 'serverSocket/socketEventConsts'

function AddTagsModal ({ ticketId, currentTags, tagsSettings, socket, getTagsWithPage, showModal, hideModal }) {
  const selectRef = useRef(null)
  const closeBtnRef = useRef(null)

  useEffect(() => {
    getTagsWithPage({ limit: -1, page: 0 })
  }, [])

  useEffect(() => {
    helpers.setupChosen()
    if (!$(selectRef.current).val() && currentTags && currentTags.length > 0)
      $(selectRef.current).val(currentTags)

    $(selectRef.current).trigger('chosen:updated')
  })

  const onCreateTagClicked = e => {
    e.preventDefault()
    hideModal()
    setTimeout(() => {
      showModal('CREATE_TAG')
    }, 300)
  }

  const onSubmit = e => {
    e.preventDefault()
    let selectedTags = $(e.target.tags).val()
    if (!selectedTags) selectedTags = []
    axios
      .put(`/api/v2/tickets/${ticketId}`, { tags: selectedTags })
      .then(() => {
        socket.emit(TICKETS_UI_TAGS_UPDATE, { ticketId })
        if (closeBtnRef.current) closeBtnRef.current.click()
      })
      .catch(error => {
        Log.error(error)
        helpers.UI.showSnackbar(error, true)
      })
  }

  const onClearClicked = () => {
    axios
      .put(`/api/v2/tickets/${ticketId}`, { tags: [] })
      .then(() => {
        $(selectRef.current).val('').trigger('chosen:updated')
        socket.emit(TICKETS_UI_TAGS_UPDATE, { ticketId })
      })
      .catch(error => {
        Log.error(error)
        helpers.UI.showSnackbar(error, true)
      })
  }

  const mappedTags =
    tagsSettings.tags &&
    tagsSettings.tags
      .map(tag => ({ text: tag.get('name'), value: tag.get('_id') }))
      .toArray()

  return (
    <BaseModal options={{ bgclose: false }}>
      <div className={'uk-clearfix'}>
        <h5 style={{ fontWeight: 300 }}>Add Tags</h5>
        <div>
          <form className='nomargin' onSubmit={onSubmit}>
            <div className='search-container'>
              <select
                name='tags'
                id='tags'
                className='chosen-select'
                multiple
                data-placeholder=' '
                data-noresults='No Tags Found for '
                ref={selectRef}
              >
                {mappedTags && mappedTags.map(tag => (
                  <option key={tag.value} value={tag.value}>
                    {tag.text}
                  </option>
                ))}
              </select>
              <button type='button' style={{ borderRadius: 0 }} onClick={onCreateTagClicked}>
                <i className='material-icons' style={{ marginRight: 0 }}>
                  add
                </i>
              </button>
            </div>

            <div className='left' style={{ marginTop: 15 }}>
              <Button type={'button'} text={'Clear'} small={true} flat={true} style={'danger'} onClick={onClearClicked} />
            </div>
            <div className='right' style={{ marginTop: 15 }}>
              <Button
                type={'button'}
                text={'Cancel'}
                style={'secondary'}
                small={true}
                flat={true}
                waves={true}
                extraClass={'uk-modal-close'}
                ref={closeBtnRef}
              />
              <Button type={'submit'} text={'Save Tags'} style={'success'} small={true} waves={true} />
            </div>
          </form>
        </div>
      </div>
    </BaseModal>
  )
}

AddTagsModal.propTypes = {
  ticketId: PropTypes.string.isRequired,
  currentTags: PropTypes.array,
  tagsSettings: PropTypes.object.isRequired,
  getTagsWithPage: PropTypes.func.isRequired,
  socket: PropTypes.object.isRequired,
  showModal: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  tagsSettings: state.tagsSettings,
  socket: state.shared.socket
})

export default connect(mapStateToProps, { getTagsWithPage, showModal, hideModal })(AddTagsModal)
