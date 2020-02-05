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
 *  Updated:    2/8/19 1:36 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  fetchMongoDBTools,
  fetchBackups,
  backupNow,
  fetchDeletedTickets,
  restoreDeletedTicket,
  permDeleteTicket,
  changeDeletedTicketsPage
} from 'actions/settings'
import Log from '../../../logger'

import $ from 'jquery'
import UIKit from 'uikit'
import axios from 'axios'
import socket from 'lib/socket'
import helpers from 'lib/helpers'

import ButtonGroup from 'components/ButtonGroup'
import Button from 'components/Button'
import SettingItem from 'components/Settings/SettingItem'
import Zone from 'components/ZoneBox/zone'
import ZoneBox from 'components/ZoneBox'

class BackupRestoreSettingsContainer extends React.Component {
  constructor (props) {
    super(props)

    this.initBackupUpload = this.initBackupUpload.bind(this)
  }

  componentDidMount () {
    this.props.fetchMongoDBTools()
    this.props.fetchBackups()
    this.props.fetchDeletedTickets()
  }

  componentDidUpdate (prevProps) {
    this.initBackupUpload()
    if (!this.deletedTicketsPagination) {
      const $deletedTicketPagination = $('.deletedTicketPagination')
      if ($deletedTicketPagination.length > 0) {
        this.deletedTicketsPagination = UIKit.pagination($deletedTicketPagination, {
          items: this.props.settings.deletedTicketsCount,
          itemsOnPage: 15
        })
        $deletedTicketPagination.on('select.uk.pagination', (e, pageIndex) => {
          this.props.changeDeletedTicketsPage(pageIndex)
        })
      }
    }

    if (prevProps.settings.deletedTicketsCount !== this.props.settings.deletedTicketsCount) {
      this.deletedTicketsPagination.pages = Math.ceil(this.props.settings.deletedTicketsCount / 15)
        ? Math.ceil(this.props.settings.deletedTicketsCount / 15)
        : 1
      this.deletedTicketsPagination.render()
      if (this.deletedTicketsPagination.currentPage > this.deletedTicketsPagination.pages - 1)
        this.deletedTicketsPagination.selectPage(this.deletedTicketsPagination.pages - 1)
    }
  }

  componentWillUnmount () {
    if (this.deletedTicketsPagination) {
      this.deletedTicketsPagination.element.off('select.uk.pagination')
      this.deletedTicketsPagination = null
    }
  }

  initBackupUpload () {
    const $progressBar = $(this.backupUploadProgressbar)
    const $uploadSelect = $(this.backupUploadSelect)
    const $uploadButton = $(this.backupUploadBtn)
    const bar = $progressBar.find('.uk-progress-bar')

    if ($progressBar.length < 1 || $uploadSelect.length < 1 || $uploadButton.length < 1) return

    const self = this

    const settings = {
      action: '/api/v1/backup/upload',
      allow: '*.zip',
      type: 'json',

      loadstart: function () {
        bar.css('width', '0%').text('0%')
        $progressBar.removeClass('hide')
        $uploadButton.addClass('hide')
      },
      notallowed: function () {
        helpers.UI.showSnackbar('Invalid File Type. Please upload a Zip file.', true)
      },
      error: function (err) {
        Log.error(err)
        helpers.UI.showSnackbar('An unknown error occurred. Check Console', true)
      },
      progress: function (percent) {
        percent = Math.ceil(percent)
        bar.css('width', percent + '%').text(percent + '%')
      },

      allcomplete: function (response) {
        Log.debug(response)
        if (!response.success) {
          helpers.UI.showSnackbar(response.error, true)
        }

        bar.css('width', '100%').text('100%')

        setTimeout(() => {
          $progressBar.addClass('hide')
          $uploadButton.removeClass('hide')
          $uploadSelect.val(null)
          self.props.fetchBackups()
          helpers.UI.playSound('success')
        }, 1500)
      }
    }

    UIKit.uploadSelect($uploadSelect, settings)
  }

  onBackupNowClicked (e) {
    e.preventDefault()
    this.props.backupNow()
  }

  oneRestoreClicked (e, backup) {
    if (!backup) return

    const filename = backup.get('filename')
    UIKit.modal.confirm(
      `<h2>Are you sure?</h2>
        <p style="font-size: 15px;">
            <span class="uk-text-danger" style="font-size: 15px;">This is a permanent action.</span> 
            This will earse the database and restore it with the selected backup file: <strong>${filename}</strong>
        </p>
        <p style="font-size: 12px;">
            Any users currently logged in will be presented with a blocking restore page. Preventing any further actions.
            Once complete all users are required to log in again.</p><br />
        <p style="font-size: 12px; font-style: italic;">
            This process may take a while depending on the size of the backup.
        </p>`,
      () => {
        socket.ui.emitShowRestoreOverlay()

        axios
          .post('/api/v1/backup/restore', { file: filename })
          .then(() => {
            helpers.UI.showSnackbar('Restore Complete. Logging all users out...')
            setTimeout(() => {
              socket.ui.emitRestoreComplete()
            }, 2000)
          })
          .catch(err => {
            Log.error(err)
            helpers.UI.showSnackbar('An error occurred. Check console.', true)
          })
      },
      {
        labels: { Ok: 'Yes', Cancel: 'No' },
        confirmButtonClass: 'md-btn-danger'
      }
    )
  }

  onDeleteBackupClicked (e, backup) {
    UIKit.modal.confirm(
      `<h2 class="text-light">Are you sure?</h2>
        <p style="font-size: 14px;">This action is permanent and will destroy the backup file: 
            <strong>${backup.get('filename')}</strong>
        </p>`,
      () => {
        axios
          .delete(`/api/v1/backup/${backup.get('filename')}`)
          .then(res => {
            if (res.data && res.data.success) {
              this.props.fetchBackups()
              helpers.UI.showSnackbar('Backup successfully deleted')
            } else {
              helpers.UI.showSnackbar('Unable to delete backup', true)
            }
          })
          .catch(err => {
            Log.error(err)
            helpers.UI.showSnackbar(`Error: ${err.response.data.error}`, true)
          })
      },
      {
        labels: { Ok: 'Yes', Cancel: 'No' },
        confirmButtonClass: 'md-btn-danger'
      }
    )
  }

  onRestoreTicketClicked (e, ticket) {
    if (!ticket) return

    this.props.restoreDeletedTicket({ _id: ticket.get('_id') })
  }

  onDeleteTicketClicked (e, ticket) {
    if (!ticket) return

    this.props.permDeleteTicket({ _id: ticket.get('_id') })
  }

  render () {
    const { active } = this.props

    return (
      <div className={active ? 'active' : 'hide'}>
        {!this.props.settings.hasMongoDBTools && (
          <SettingItem
            title={'MongoDB Tools Not Found'}
            subtitle={'Unable to locate MongoDB tools. Please make sure MongoDB tools are installed.'}
          >
            <div>
              <h4>Installing MongoDB Tools</h4>
              <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                MongoDB Tools are required to perform backup and restore. See below for instructions on installing
                MongoDB Tools.
              </p>
              <br />
              <h5>
                <strong>Ubuntu 16.04</strong>
              </h5>
              <pre style={{ whiteSpace: 'pre-line' }}>
                wget
                https://repo.mongodb.org/apt/ubuntu/dists/xenial/mongodb-org/3.6/multiverse/binary-amd64/mongodb-org-tools_3.6.9_amd64.deb
                && \ dpkg -i mongodb-org-tools_3.6.9_amd64.deb
              </pre>
              <br />
              <h5>
                <strong>Ubuntu 18.04</strong>
              </h5>
              <pre style={{ whiteSpace: 'pre-line' }}>sudo apt install -y mongo-tools</pre>
              <br />
              <h5>
                <strong>Fedora 29</strong>
              </h5>
              <pre>dnf install -y mongo-tools</pre>
              <br />
              <h5>
                <strong>Alpine Linux</strong>
              </h5>
              <pre>apk add mongodb-tools</pre>
            </div>
          </SettingItem>
        )}
        {this.props.settings.hasMongoDBTools && (
          <div>
            <SettingItem
              title={'Backup Now'}
              subtitle={'Backup all site data. (Database, Attachments, Assets)'}
              component={
                <div className={'uk-float-right mt-10'}>
                  <div
                    className={
                      'uk-progress uk-progress-success uk-progress-striped uk-active' +
                      (!this.props.settings.backingup ? ' hide ' : '')
                    }
                    style={{ height: '31px', background: 'transparent' }}
                  >
                    <div
                      className='uk-progress-bar uk-float-right'
                      style={{ width: '115px', fontSize: '11px', textTransform: 'uppercase', lineHeight: '31px' }}
                    >
                      Please Wait...
                    </div>
                  </div>
                  {!this.props.settings.backingup && (
                    <Button
                      text={'Backup Now'}
                      style={'success'}
                      small={true}
                      styleOverride={{ width: '115px' }}
                      onClick={e => this.onBackupNowClicked(e)}
                    />
                  )}
                </div>
              }
            />
            <SettingItem
              title={'Backups'}
              subtitle={'Currently stored backups'}
              component={
                <div className={'uk-float-right mt-10'} style={{ width: '85px' }}>
                  <div
                    className={'uk-progress hide'}
                    style={{ height: '31px' }}
                    ref={i => (this.backupUploadProgressbar = i)}
                  >
                    <div className='uk-progress-bar' style={{ width: 0, lineHeight: '31px', fontSize: '11px' }}>
                      0%
                    </div>
                  </div>
                  <form className='uk-form-stacked'>
                    <button
                      className={'md-btn md-btn-small md-btn-primary uk-form-file no-ajaxy'}
                      style={{ width: '85px' }}
                      ref={i => (this.backupUploadBtn = i)}
                    >
                      Upload
                      <input ref={i => (this.backupUploadSelect = i)} type={'file'} name={'backupUploadSelect'} />
                    </button>
                  </form>
                </div>
              }
            >
              {this.props.settings.backups.size < 1 && (
                <Zone>
                  <ZoneBox>
                    <h2 className={'uk-text-muted uk-text-center'}>No Backups</h2>
                  </ZoneBox>
                </Zone>
              )}
              {this.props.settings.backups.size > 0 && (
                <table className='uk-table mt-0'>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Size</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {this.props.settings.backups.map(backup => {
                      return (
                        <tr key={backup.get('filename')}>
                          <td className={'valign-middle'} style={{ width: '60%', height: '60px' }}>
                            {backup.get('filename')}
                          </td>
                          <td className='valign-middle'>{backup.get('sizeFormat')}</td>
                          <td className='uk-text-right valign-middle'>
                            <ButtonGroup>
                              <a
                                href={`/backups/${backup.get('filename')}`}
                                className={'md-btn md-btn-small md-btn-wave no-ajaxy'}
                                download={backup.get('filename')}
                              >
                                download
                              </a>
                              <Button
                                text={'Restore'}
                                small={true}
                                waves={true}
                                onClick={e => this.oneRestoreClicked(e, backup)}
                              />
                              <Button
                                text={'Delete'}
                                small={true}
                                style={'danger'}
                                waves={true}
                                onClick={e => this.onDeleteBackupClicked(e, backup)}
                              />
                            </ButtonGroup>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </SettingItem>
          </div>
        )}
        <SettingItem title={'Deleted Tickets'} subtitle={'Tickets marked as deleted are shown below.'}>
          {this.props.settings.deletedTickets.size < 1 && (
            <Zone>
              <ZoneBox>
                <h2 className='uk-text-muted uk-text-center'>No Deleted Tickets</h2>
              </ZoneBox>
            </Zone>
          )}
          {this.props.settings.deletedTickets.size > 0 && (
            <div>
              <table className='uk-table mt-0 mb-5'>
                <thead>
                  <tr>
                    <th>UID</th>
                    <th>Subject</th>
                    <th>Group</th>
                    <th>Date</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {this.props.settings.deletedTickets.map(ticket => {
                    return (
                      <tr key={ticket.get('_id')}>
                        <td className='valign-middle' style={{ width: '10%', height: '60px' }}>
                          {ticket.get('uid')}
                        </td>
                        <td className='valign-middle' style={{ width: '30%' }}>
                          {ticket.get('subject')}
                        </td>
                        <td className='valign-middle' style={{ width: '30%' }}>
                          {ticket.getIn(['group', 'name'])}
                        </td>
                        <td className='valign-middle' style={{ width: '30%' }}>
                          {ticket.get('date')}
                        </td>
                        <td className='uk-text-right valign-middle'>
                          <ButtonGroup>
                            <Button
                              text={'Delete'}
                              style={'danger'}
                              small={true}
                              waves={true}
                              onClick={e => this.onDeleteTicketClicked(e, ticket)}
                            />
                            <Button
                              text={'Restore'}
                              small={true}
                              waves={true}
                              onClick={e => this.onRestoreTicketClicked(e, ticket)}
                            />
                          </ButtonGroup>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className='uk-pagination deletedTicketPagination' />
            </div>
          )}
        </SettingItem>
      </div>
    )
  }
}

BackupRestoreSettingsContainer.propTypes = {
  active: PropTypes.bool.isRequired,
  fetchMongoDBTools: PropTypes.func.isRequired,
  fetchBackups: PropTypes.func.isRequired,
  fetchDeletedTickets: PropTypes.func.isRequired,
  changeDeletedTicketsPage: PropTypes.func.isRequired,
  backupNow: PropTypes.func.isRequired,
  restoreDeletedTicket: PropTypes.func.isRequired,
  permDeleteTicket: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings
})

export default connect(mapStateToProps, {
  fetchBackups,
  fetchMongoDBTools,
  backupNow,
  fetchDeletedTickets,
  restoreDeletedTicket,
  permDeleteTicket,
  changeDeletedTicketsPage
})(BackupRestoreSettingsContainer)
