/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/23/19 6:12 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { getTagsWithPage } from 'actions/tickets'

import BaseModal from 'containers/Modals/BaseModal'
import Log from '../../logger'
import axios from 'axios'
import $ from 'jquery'
import helpers from 'lib/helpers'
import socket from 'lib/socket'

class AddTagsModal extends React.Component {
  componentDidMount () {
    this.props.getTagsWithPage({ limit: -1, page: 0 })
  }

  componentDidUpdate () {
    helpers.setupChosen()
    if (!$(this.select).val() && this.props.currentTags && this.props.currentTags.length > 0)
      $(this.select).val(this.props.currentTags)

    $(this.select).trigger('chosen:updated')
  }

  onSubmit (e) {
    e.preventDefault()
    let selectedTags = $(e.target.tags).val()
    if (!selectedTags) selectedTags = []
    axios
      .put(`/api/v1/tickets/${this.props.ticketId}`, {
        tags: selectedTags
      })
      .then(() => {
        socket.ui.refreshTicketTags(this.props.ticketId)
        this.closeButton.click()
      })
      .catch(error => {
        Log.error(error)
        helpers.UI.showSnackbar(error, true)
      })
  }

  render () {
    const mappedTags =
      this.props.tagsSettings.tags &&
      this.props.tagsSettings.tags
        .map(tag => {
          return {
            text: tag.get('name'),
            value: tag.get('_id')
          }
        })
        .toArray()

    return (
      <BaseModal options={{ bgclose: false }}>
        <div className={'uk-clearfix'}>
          <h5 style={{ fontWeight: 300 }}>Add Tags</h5>
          <div>
            <form className='nomargin' onSubmit={e => this.onSubmit(e)}>
              <div className='search-container'>
                <select
                  name='tags'
                  id='tags'
                  className='chosen-select'
                  multiple
                  data-placeholder=' '
                  data-noresults='No Tags Found for '
                  ref={r => (this.select = r)}
                >
                  {mappedTags.map(tag => (
                    <option key={tag.value} value={tag.value}>
                      {tag.text}
                    </option>
                  ))}
                </select>
                <button type='button' style={{ borderRadius: 0 }}>
                  <i className='fa fa-plus' style={{ marginRight: 0 }} />
                </button>
              </div>

              <div className='left' style={{ marginTop: 15 }}>
                <button className='uk-button red nomargin' type='button'>
                  Clear
                </button>
              </div>
              <div className='right' style={{ marginTop: 15 }}>
                <button
                  className='uk-button uk-button-secondary cancel uk-modal-close'
                  type='button'
                  style={{ margin: '0 5px 0 0' }}
                  ref={r => (this.closeButton = r)}
                >
                  Cancel
                </button>
                <button className='uk-button uk-button-success nomargin' type='submit'>
                  Save Tags
                </button>
              </div>
            </form>
          </div>
        </div>
      </BaseModal>
    )
  }
}

AddTagsModal.propTypes = {
  ticketId: PropTypes.string.isRequired,
  currentTags: PropTypes.array,
  tagsSettings: PropTypes.object.isRequired,
  getTagsWithPage: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  tagsSettings: state.tagsSettings
})

export default connect(
  mapStateToProps,
  { getTagsWithPage }
)(AddTagsModal)
