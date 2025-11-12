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
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { List } from 'immutable'

import {
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  toggleWebhook,
  testWebhook
} from 'actions/webhooks'

import helpers from 'lib/helpers'

import SettingItem from 'components/Settings/SettingItem'
import EnableSwitch from 'components/Settings/EnableSwitch'
import Button from 'components/Button'

const emptyForm = {
  name: '',
  url: '',
  secret: '',
  events: []
}

class WebhooksSettingsContainer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      form: { ...emptyForm },
      editingWebhookId: null,
      editingValues: null
    }
  }

  componentDidMount () {
    if (this.props.active) this.props.fetchWebhooks()
  }

  componentDidUpdate (prevProps) {
    if (!prevProps.active && this.props.active) {
      this.props.fetchWebhooks()
    }
  }

  onFormInputChange (field, value) {
    this.setState(prev => ({
      form: {
        ...prev.form,
        [field]: value
      }
    }))
  }

  onFormEventToggle (eventName) {
    this.setState(prev => {
      const events = prev.form.events.includes(eventName)
        ? prev.form.events.filter(e => e !== eventName)
        : prev.form.events.concat(eventName)

      return {
        form: {
          ...prev.form,
          events
        }
      }
    })
  }

  resetForm () {
    this.setState({ form: { ...emptyForm } })
  }

  handleCreate (e) {
    e.preventDefault()
    const { form } = this.state
    if (!form.name.trim()) return helpers.UI.showSnackbar('Webhook name is required', true)
    if (!form.url.trim()) return helpers.UI.showSnackbar('Webhook URL is required', true)
    if (!form.events || form.events.length < 1)
      return helpers.UI.showSnackbar('Select at least one event', true)

    this.props.createWebhook({
      name: form.name.trim(),
      url: form.url.trim(),
      secret: form.secret ? form.secret.trim() : undefined,
      events: form.events,
      enabled: true
    })
    this.resetForm()
  }

  handleToggle (webhook) {
    this.props.toggleWebhook({ _id: webhook._id, enabled: !webhook.enabled })
  }

  handleDelete (webhook) {
    if (window.confirm(`Delete webhook "${webhook.name}"?`)) {
      this.props.deleteWebhook({ _id: webhook._id })
    }
  }

  handleTest (webhook) {
    this.props.testWebhook({ _id: webhook._id })
  }

  beginEdit (webhook) {
    this.setState({
      editingWebhookId: webhook._id,
      editingValues: {
        _id: webhook._id,
        name: webhook.name,
        url: webhook.url,
        secret: '',
        events: [...(webhook.events || [])],
        enabled: webhook.enabled
      }
    })
  }

  cancelEdit () {
    this.setState({ editingWebhookId: null, editingValues: null })
  }

  onEditInputChange (field, value) {
    this.setState(prev => ({
      editingValues: {
        ...prev.editingValues,
        [field]: value
      }
    }))
  }

  onEditEventToggle (eventName) {
    this.setState(prev => {
      const values = prev.editingValues || { events: [] }
      const events = values.events.includes(eventName)
        ? values.events.filter(e => e !== eventName)
        : values.events.concat(eventName)

      return {
        editingValues: {
          ...values,
          events
        }
      }
    })
  }

  handleEditSave (e) {
    e.preventDefault()
    const { editingValues, editingWebhookId } = this.state
    if (!editingValues) return
    if (!editingValues.name.trim()) return helpers.UI.showSnackbar('Webhook name is required', true)
    if (!editingValues.url.trim()) return helpers.UI.showSnackbar('Webhook URL is required', true)
    if (!editingValues.events || editingValues.events.length < 1)
      return helpers.UI.showSnackbar('Select at least one event', true)

    const payload = {
      _id: editingWebhookId,
      name: editingValues.name.trim(),
      url: editingValues.url.trim(),
      events: editingValues.events,
      enabled: editingValues.enabled
    }

    if (editingValues.secret && editingValues.secret.trim()) {
      payload.secret = editingValues.secret.trim()
    }

    this.props.updateWebhook(payload)
    this.cancelEdit()
  }

  renderEventCheckboxes (events, selectedEvents, onToggle) {
    if (!events || events.length === 0) return null

    return (
      <div className='uk-grid uk-grid-small'>
        {events.map(eventName => (
          <div key={eventName} className='uk-width-medium-1-3 uk-width-small-1-2 uk-margin-small-bottom'>
            <label style={{ cursor: 'pointer' }}>
              <input
                type='checkbox'
                className='uk-margin-small-right'
                checked={selectedEvents.includes(eventName)}
                onChange={() => onToggle(eventName)}
              />
              {eventName}
            </label>
          </div>
        ))}
      </div>
    )
  }

  renderLogs (webhook) {
    const logs = webhook.logs || []
    const failures = webhook.failureLog || []
    const combined = logs.concat(
      failures.filter(entry => !logs.find(l => l.timestamp === entry.timestamp && l.message === entry.message))
    )
    if (combined.length === 0) return <p className='uk-text-muted'>No delivery attempts recorded.</p>

    return (
      <table className='uk-table uk-table-striped uk-margin-small-top'>
        <thead>
          <tr>
            <th style={{ width: '25%' }}>Timestamp</th>
            <th style={{ width: '15%' }}>Status</th>
            <th style={{ width: '15%' }}>Code</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {combined
            .slice()
            .reverse()
            .map((entry, index) => (
              <tr key={index}>
                <td>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}</td>
                <td>{entry.status || 'failed'}</td>
                <td>{entry.responseCode || '—'}</td>
                <td>{entry.message || '—'}</td>
              </tr>
            ))}
        </tbody>
      </table>
    )
  }

  renderWebhook (webhook, supportedEvents) {
    const isEditing = this.state.editingWebhookId === webhook._id
    const editingValues = this.state.editingValues || {}

    return (
      <SettingItem
        key={webhook._id}
        title={
          <span>
            {webhook.name}
            <span className='uk-text-muted' style={{ fontSize: '12px', marginLeft: '8px' }}>
              {webhook.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </span>
        }
        subtitle={`URL: ${webhook.url}`}
        component={
          <EnableSwitch
            checked={webhook.enabled}
            onChange={() => this.handleToggle(webhook)}
            label='Enabled'
          />
        }
        footer={
          <div className='uk-flex uk-flex-middle uk-flex-space-between uk-flex-wrap'>
            <div>
              <div className='uk-text-muted' style={{ fontSize: '12px' }}>
                <strong>Events:</strong> {webhook.events && webhook.events.length ? webhook.events.join(', ') : 'None'}
              </div>
              <div className='uk-text-muted' style={{ fontSize: '12px' }}>
                <strong>Last status:</strong> {webhook.lastStatus || 'idle'}
                {webhook.lastResponseCode ? ` (HTTP ${webhook.lastResponseCode})` : ''}
                {webhook.lastTriggeredAt
                  ? ` at ${new Date(webhook.lastTriggeredAt).toLocaleString()}`
                  : ''}
              </div>
              {webhook.lastError && (
                <div className='uk-text-danger' style={{ fontSize: '12px' }}>
                  <strong>Last error:</strong> {webhook.lastError}
                </div>
              )}
              <div className='uk-text-muted' style={{ fontSize: '12px' }}>
                <strong>Failure count:</strong> {webhook.failureCount || 0}
              </div>
            </div>
            <div>
              <Button text='Test' small style='success' onClick={() => this.handleTest(webhook)} />
              <Button text='Edit' small flat onClick={() => this.beginEdit(webhook)} />
              <Button text='Delete' small style='danger' onClick={() => this.handleDelete(webhook)} />
            </div>
          </div>
        }
        subPanelPadding='10px'
      >
        {isEditing ? (
          <form className='uk-form uk-form-stacked' onSubmit={e => this.handleEditSave(e)}>
            <div className='uk-grid uk-grid-small'>
              <div className='uk-width-medium-1-2'>
                <label className='uk-form-label'>Name</label>
                <input
                  type='text'
                  className='md-input'
                  value={editingValues.name || ''}
                  onChange={e => this.onEditInputChange('name', e.target.value)}
                />
              </div>
              <div className='uk-width-medium-1-2'>
                <label className='uk-form-label'>URL</label>
                <input
                  type='text'
                  className='md-input'
                  value={editingValues.url || ''}
                  onChange={e => this.onEditInputChange('url', e.target.value)}
                />
              </div>
            </div>
            <div className='uk-grid uk-grid-small uk-margin-small-top'>
              <div className='uk-width-medium-1-2'>
                <label className='uk-form-label'>Secret (leave blank to keep current)</label>
                <input
                  type='text'
                  className='md-input'
                  value={editingValues.secret || ''}
                  onChange={e => this.onEditInputChange('secret', e.target.value)}
                />
              </div>
            </div>
            <div className='uk-margin-small-top'>
              <label className='uk-form-label'>Events</label>
              {this.renderEventCheckboxes(supportedEvents, editingValues.events || [], name =>
                this.onEditEventToggle(name)
              )}
            </div>
            <div className='uk-margin-top'>
              <Button type='submit' text='Save' style='primary' small />
              <Button text='Cancel' small flat onClick={() => this.cancelEdit()} />
            </div>
          </form>
        ) : (
          <div>
            <h5 className='uk-text-bold uk-margin-small-bottom'>Delivery History</h5>
            {this.renderLogs(webhook)}
          </div>
        )}
      </SettingItem>
    )
  }

  render () {
    if (!this.props.active) return null

    const supportedEvents = Array.isArray(this.props.supportedEvents)
      ? this.props.supportedEvents
      : this.props.supportedEvents instanceof List
        ? this.props.supportedEvents.toArray()
        : []
    const webhooks = this.props.webhooks instanceof List ? this.props.webhooks.toJS() : this.props.webhooks

    return (
      <div className={this.props.active ? '' : 'hide'}>
        <SettingItem
          title='Create Webhook'
          subtitle='Define a new webhook endpoint to receive ticket events.'
          component={<span />}
          extraClass='no-hover'
          subPanelPadding='20px'
        >
          <form className='uk-form uk-form-stacked' onSubmit={e => this.handleCreate(e)}>
            <div className='uk-grid uk-grid-small'>
              <div className='uk-width-medium-1-3'>
                <label className='uk-form-label'>Name</label>
                <input
                  type='text'
                  className='md-input'
                  value={this.state.form.name}
                  onChange={e => this.onFormInputChange('name', e.target.value)}
                />
              </div>
              <div className='uk-width-medium-1-3'>
                <label className='uk-form-label'>URL</label>
                <input
                  type='text'
                  className='md-input'
                  value={this.state.form.url}
                  onChange={e => this.onFormInputChange('url', e.target.value)}
                />
              </div>
              <div className='uk-width-medium-1-3'>
                <label className='uk-form-label'>Secret (optional)</label>
                <input
                  type='text'
                  className='md-input'
                  value={this.state.form.secret}
                  onChange={e => this.onFormInputChange('secret', e.target.value)}
                />
              </div>
            </div>
            <div className='uk-margin-small-top'>
              <label className='uk-form-label'>Events</label>
              {this.renderEventCheckboxes(supportedEvents, this.state.form.events, name =>
                this.onFormEventToggle(name)
              )}
            </div>
            <div className='uk-margin-top'>
              <Button type='submit' text='Create Webhook' style='primary' small />
            </div>
          </form>
        </SettingItem>

        <div className='uk-margin-large-top'>
          {webhooks && webhooks.length > 0 ? (
            webhooks.map(webhook => this.renderWebhook(webhook, supportedEvents))
          ) : (
            <p className='uk-text-muted'>No webhooks configured yet.</p>
          )}
        </div>
      </div>
    )
  }
}

WebhooksSettingsContainer.propTypes = {
  active: PropTypes.bool.isRequired,
  fetchWebhooks: PropTypes.func.isRequired,
  createWebhook: PropTypes.func.isRequired,
  updateWebhook: PropTypes.func.isRequired,
  deleteWebhook: PropTypes.func.isRequired,
  toggleWebhook: PropTypes.func.isRequired,
  testWebhook: PropTypes.func.isRequired,
  webhooks: PropTypes.oneOfType([PropTypes.array, PropTypes.instanceOf(List)]),
  supportedEvents: PropTypes.oneOfType([PropTypes.array, PropTypes.instanceOf(List)])
}

WebhooksSettingsContainer.defaultProps = {
  webhooks: [],
  supportedEvents: []
}

const mapStateToProps = state => ({
  webhooks: state.webhooksState.webhooks,
  supportedEvents: state.webhooksState.supportedEvents
})

export default connect(mapStateToProps, {
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  toggleWebhook,
  testWebhook
})(WebhooksSettingsContainer)
