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
 *  Updated:    2/10/19 3:06 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { makeObservable, observable, when } from 'mobx'
import { head, orderBy } from 'lodash'
import axios from 'axios'
import Log from '../../logger'
import { createTicket, fetchTicketTypes, getTagsWithPage } from 'actions/tickets'
import { fetchGroups } from 'actions/groups'
import { fetchAccountsCreateTicket } from 'actions/accounts'
import { fetchSettings } from 'actions/settings'

import $ from 'jquery'
import helpers from 'lib/helpers'

import BaseModal from 'containers/Modals/BaseModal'
import Grid from 'components/Grid'
import GridItem from 'components/Grid/GridItem'
import SingleSelect from 'components/SingleSelect'
import SpinLoader from 'components/SpinLoader'
import Button from 'components/Button'
import EasyMDE from 'components/EasyMDE'

@observer
class CreateTicketFromChatwootModalContainer extends React.Component {
    @observable priorities = []
    @observable allAccounts = this.props.accounts || []
    @observable groupAccounts = []
    @observable selectedPriority = ''
    issueText = ''
    @observable user = this.props.user;
    @observable group = this.props.group;
    @observable defaultTicketTypes
    @observable conversationID = this.props.conversationID
    @observable accountID = this.props.accountID
    @observable contactName = this.props.contactName
    @observable phoneNumber = this.props.phoneNumber
    @observable comment
    @observable clientName = ''
    @observable agentName = ''
    @observable ActiveUnloadingTheDialog = false

    constructor(props) {
        super(props)
        makeObservable(this)
    }

    componentDidMount() {
        this.props.fetchTicketTypes()
        this.props.getTagsWithPage({ limit: -1 })
        this.props.fetchGroups()
        this.props.fetchAccountsCreateTicket({ type: 'all', limit: 1000 })
        this.props.fetchSettings()
        helpers.UI.inputs()
        helpers.formvalidator()
        this.defaultTicketTypeWatcher = when(
            () => this.props.viewdata.get('defaultTicketType'),
            () => {
                this.priorities = orderBy(this.props.viewdata.toJS().defaultTicketType.priorities, ['migrationNum'])
                this.selectedPriority = head(this.priorities) ? head(this.priorities)._id : ''
            }
        )

    }

    componentDidUpdate(prevProps) {
        // helpers.UI.reRenderInputs()
        // if (prevProps.settings !== this.props.settings) {
        //   if (this.state.chatwootTemplateMessage !== this.getSetting('chatwootTemplateMessage'))
        //     this.state.chatwootTemplateMessage = this.getSetting('chatwootTemplateMessage')
        // }
    }

    componentWillUnmount() {
        if (this.defaultTicketTypeWatcher) this.defaultTicketTypeWatcher()
    }

    getSetting(stateName) {
        return this.props.settings.getIn(['settings', stateName, 'value'])
            ? this.props.settings.getIn(['settings', stateName, 'value'])
            : ''
    }

    onTicketTypeSelectChange(e) {
        this.priorityWrapper.classList.add('hide')
        this.priorityLoader.classList.remove('hide')
        axios
            .get(`/api/v1/tickets/type/${e.target.value}`)
            .then(res => {
                const type = res.data.type
                if (type && type.priorities) {
                    this.priorities = orderBy(type.priorities, ['migrationNum'])
                    this.selectedPriority = head(orderBy(type.priorities, ['migrationNum']))
                        ? head(orderBy(type.priorities, ['migrationNum']))._id
                        : ''

                    setTimeout(() => {
                        this.priorityLoader.classList.add('hide')
                        this.priorityWrapper.classList.remove('hide')
                    }, 500)
                }
            })
            .catch(error => {
                this.priorityLoader.classList.add('hide')
                Log.error(error)
                helpers.UI.showSnackbar(`Error: ${error.response.data.error}`)
            })
    }

    onPriorityRadioChange(e) {
        this.selectedPriority = e.target.value
    }

    onFormSubmit(e) {
        e.preventDefault()
        const $form = $(e.target)

        const data = {}
        if (this.issueText.length < 1) return
        const allowAgentUserTickets = true
        const minIssueLength = this.props.viewdata.get('ticketSettings').get('minIssue')
        let $mdeError
        const $issueTextbox = $(this.issueMde.element)
        const $errorBorderWrap = $issueTextbox.parents('.error-border-wrap')
        if (this.issueText.length < minIssueLength) {
            $errorBorderWrap.css({ border: '1px solid #E74C3C' })
            const mdeError = $(
                `<div class="mde-error uk-float-left uk-text-left">Please enter a valid issue. Issue must contain at least ${minIssueLength} characters</div>`
            )
            $mdeError = $issueTextbox.siblings('.editor-statusbar').find('.mde-error')
            if ($mdeError.length < 1) $issueTextbox.siblings('.editor-statusbar').prepend(mdeError)

            return
        }

        $errorBorderWrap.css('border', 'none')
        $mdeError = $issueTextbox.parent().find('.mde-error')
        if ($mdeError.length > 0) $mdeError.remove()

        if (!$form.isValid(null, null, false)) return true

        if (allowAgentUserTickets) data.owner = this.ownerSelect.value

        data.subject = e.target.subject.value
        data.group = this.groupSelect.value
        data.type = this.typeSelect.value
        data.tags = this.tagSelect.value
        data.priority = this.selectedPriority
        data.issue = this.issueMde.easymde.value()
        data.socketid = this.props.socket.io.engine.id
        data.assignee = this.props.shared.sessionUser._id
        if (this.ActiveUnloadingTheDialog) {
            data.comment = this.comment
        } else {
            data.comment = ''
        }
        data.fromChatwoot = true;
        data.chatwootConversationID = this.conversationID;
        data.chatwootAccountID = this.accountID;

        axios.post('/api/v1/tickets/create', data).then(res => {
            let ticketUID = res.data.ticket.uid
            let ticketSubject = `https://trudesk-dev.shatura.pro/tickets/${ticketUID}`
            if (ticketUID) {
                this.sendNotification(ticketSubject);
            }
            location.href = `https://trudesk-dev.shatura.pro/tickets/${ticketUID}`
        })
    }

    unloadingTheDialog() {

        let config = {
            method: 'Get',
            url: `https://cw.shatura.pro/api/v1/accounts/${this.accountID}/conversations/${this.conversationID}/messages`,
            headers: {
                'api_access_token': this.props.sessionUser.chatwootApiKey,
                'Content-Type': 'application/json',
            },
        };

        axios(config)
            .then((response) => {
                this.messages = response.data.payload;
                this.messages.map(message => {
                    const date = new Date(message.created_at * 1000);
                    let senderName;
                    if (!message.sender) {
                        senderName = `<p style="color:#E74C3C; font-weight: bold"> Системное сообщение  <h style="font-size: 11px; color: #545A63; font-weight: lighter;"> ${date.toUTCString()} </h></p>`;
                    } else if (message.sender.name == this.clientName || this.clientName == '') {
                        this.clientName = message.sender.name
                        senderName = `<p style='color:#39f; font-weight: bold'> ${this.clientName} <h style="font-size: 11px; color: #545A63; font-weight: lighter;"> ${date.toUTCString()}</h></p>`;
                    } else {
                        this.agentName = message.sender.name;
                        senderName = `<p style='color:#29b955; font-weight: bold'> ${this.agentName} <h style="font-size: 11px; color: #545A63; font-weight: lighter;"> ${date.toUTCString()} </h></p>`;
                    }

                    if (!this.comment) this.comment = '';
                    this.comment = this.comment + `
                 ${senderName} 
                <p>${message.content}</p>
                <p></p> 
                <p></p> 
                `
                })
            })
            .catch((error) => {
                console.log(error);
            });
    }

    sendNotification(ticketSubject) {
        if (this.getSetting('chatwootSettings')) {
        let contentMessage = String(this.getSetting('chatwootMessageTemplate'));
        contentMessage = contentMessage.replace('{phoneNumber}', this.phoneNumber);
        contentMessage = contentMessage.replace('{ticketSubject}', ticketSubject);
        contentMessage = contentMessage.replace('{contactName}', this.contactName);
        const message = {
            "content": contentMessage,
            "message_type": "outgoing",
            "private": false,
            "content_attributes": {}
        }
        let config = {
            method: 'Post',
            url: `https://cw.shatura.pro/api/v1/accounts/${this.accountID}/conversations/${this.conversationID}/messages`,
            headers: {
                'api_access_token': this.props.sessionUser.chatwootApiKey,
                'Content-Type': 'application/json',
            },
            data: message
        };

        axios(config)
            .then((response) => {
                console.log(JSON.stringify(response.data));
            })
            .catch((error) => {
                console.log(error);
            });
        }
    }

    onActiveUnloadingTheDialog(e) {
        if (this.getSetting('chatwootSettings')) {
            this.ActiveUnloadingTheDialog = !this.ActiveUnloadingTheDialog;
            if (this.ActiveUnloadingTheDialog && !this.comment) {
                this.unloadingTheDialog();
            }
        }
    }

    onGroupSelectChange(e) {
        // this.groupAccounts = this.props.groups
        //   .filter(grp => grp.get('_id') === e.target.value)
        //   .first()
        //   .get('members')
        //   .map(a => {
        //     return { text: a.get('fullname'), value: a.get('_id') }
        //   })
        //   .toArray()
    }

    render() {

        const mappedAccounts = this.props.accounts
            .map(a => {
                return { text: a.get('fullname'), value: a.get('_id') }
            })
            .toArray()

        const mappedGroups = this.props.groups
            .map(grp => {
                return { text: grp.get('name'), value: grp.get('_id') }
            })
            .toArray()

        const mappedTicketTypes = this.props.ticketTypes.toArray().map(type => {
            if (type.get('name') == 'Task') this.defaultTicketTypes = type.get('_id')
            return { text: type.get('name'), value: type.get('_id') }
        })

        const mappedTicketTags = this.props.ticketTags.toArray().map(tag => {
            return { text: tag.get('name'), value: tag.get('_id') }
        })
        return (
            <BaseModal {...this.props} options={{ bgclose: false }}>
                <form className={'uk-form-stacked'} onSubmit={e => this.onFormSubmit(e)}>
                    <div className='uk-margin-medium-bottom'>
                        <label>Subject</label>
                        <input
                            type='text'
                            name={'subject'}
                            className={'md-input'}
                        />
                    </div>
                    <div className='uk-margin-medium-bottom'>
                        <Grid>
                            {
                                <GridItem width={'2-3'}>
                                    <label className={'uk-form-label'}>Owner</label>
                                    <SingleSelect
                                        showTextbox={true}
                                        items={mappedAccounts}
                                        defaultValue={this.user}
                                        disabled={true}
                                        width={'100%'}
                                        ref={i => (this.ownerSelect = i)}
                                    />
                                </GridItem>
                            }
                            <GridItem width={'1-3'}>
                                <label className={'uk-form-label'}>Group</label>
                                <SingleSelect
                                    showTextbox={false}
                                    items={mappedGroups}
                                    defaultValue={this.group}
                                    onSelectChange={e => this.onGroupSelectChange(e)}
                                    width={'100%'}
                                    ref={i => (this.groupSelect = i)}
                                />
                            </GridItem>
                        </Grid>
                    </div>
                    <div className='uk-margin-medium-bottom'>
                        <Grid>
                            <GridItem width={'1-3'}>
                                <label className={'uk-form-label'}>Type</label>
                                <SingleSelect
                                    showTextbox={false}
                                    items={mappedTicketTypes}
                                    width={'100%'}
                                    defaultValue={this.defaultTicketTypes}
                                    onSelectChange={e => {
                                        this.onTicketTypeSelectChange(e)
                                    }}
                                    ref={i => (this.typeSelect = i)}
                                />
                            </GridItem>
                            <GridItem width={'2-3'}>
                                <label className={'uk-form-label'}>Tags</label>
                                <SingleSelect
                                    showTextbox={false}
                                    items={mappedTicketTags}
                                    width={'100%'}
                                    multiple={true}
                                    ref={i => (this.tagSelect = i)}
                                />
                            </GridItem>
                        </Grid>
                    </div>
                    <div className='uk-margin-medium-bottom'>
                        <label className={'uk-form-label'}>Priority</label>
                        <div
                            ref={i => (this.priorityLoader = i)}
                            style={{ height: '32px', width: '32px', position: 'relative' }}
                            className={'hide'}
                        >
                            <SpinLoader
                                style={{ background: 'transparent' }}
                                spinnerStyle={{ width: '24px', height: '24px' }}
                                active={true}
                            />
                        </div>
                        <div ref={i => (this.priorityWrapper = i)} className={'uk-clearfix'}>
                            {this.priorities.map(priority => {
                                return (
                                    <div key={priority._id} className={'uk-float-left'}>
                                        <span className={'icheck-inline'}>
                                            <input
                                                id={'p___' + priority._id}
                                                name={'priority'}
                                                type='radio'
                                                className={'with-gap'}
                                                value={priority._id}
                                                onChange={e => {
                                                    this.onPriorityRadioChange(e)
                                                }}
                                                checked={this.selectedPriority === priority._id}
                                                data-md-icheck
                                            />
                                            <label htmlFor={'p___' + priority._id} className={'mb-10 inline-label'}>
                                                <span className='uk-badge' style={{ backgroundColor: priority.htmlColor }}>
                                                    {priority.name}
                                                </span>
                                            </label>
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className={'uk-text-left'} style={{ 'padding-bottom': '15px' }}>

                        <h style={{ 'font-weight': '500', 'font-size': '14px' }}>Attach conversation as a ticket comment</h>
                        <input
                            type='checkbox'
                            id={`activeUnloadingTheDialog`}
                            style={{ display: 'none' }}
                            onChange={e => this.onActiveUnloadingTheDialog(e)}
                            className='svgcheckinput'
                        />
                        <label htmlFor={`activeUnloadingTheDialog`} className='svgcheck' style={{ 'display': 'inline' }}>
                            <svg style={{ 'margin-left': '5px' }} width='16px' height='16px' viewBox='0 0 18 18'>
                                <path d='M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z' />
                                <polyline points='1 9 7 14 15 4' />
                            </svg>
                        </label>
                    </div>

                    <div className='uk-margin-medium-bottom'>
                        <span>Description</span>
                        <div className='error-border-wrap uk-clearfix'>
                            <EasyMDE
                                ref={i => (this.issueMde = i)}
                                onChange={val => (this.issueText = val)}
                                allowImageUpload={true}
                                inlineImageUploadUrl={'/tickets/uploadmdeimage'}
                                inlineImageUploadHeaders={{ ticketid: 'uploads' }}
                            />
                        </div>
                        <span style={{ marginTop: '6px', display: 'inline-block', fontSize: '11px' }} className={'uk-text-muted'}>
                            Please try to be as specific as possible. Please include any details you think may be relevant, such as
                            {/* eslint-disable-next-line react/no-unescaped-entities */}
                            troubleshooting steps you've taken.
                        </span>
                    </div>
                    <div className='uk-modal-footer uk-text-right'>
                        <Button text={'Cancel'} flat={true} waves={true} extraClass={'uk-modal-close'} />
                        <Button text={'Create'} style={'primary'} flat={true} type={'submit'} />
                    </div>
                </form>
            </BaseModal>
        )
    }
}

CreateTicketFromChatwootModalContainer.propTypes = {
    shared: PropTypes.object.isRequired,
    socket: PropTypes.object.isRequired,
    viewdata: PropTypes.object.isRequired,
    ticketTypes: PropTypes.object.isRequired,
    priorities: PropTypes.object.isRequired,
    ticketTags: PropTypes.object.isRequired,
    accounts: PropTypes.object.isRequired,
    groups: PropTypes.object.isRequired,
    createTicket: PropTypes.func.isRequired,
    fetchTicketTypes: PropTypes.func.isRequired,
    getTagsWithPage: PropTypes.func.isRequired,
    fetchGroups: PropTypes.func.isRequired,
    fetchAccountsCreateTicket: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
    shared: state.shared,
    socket: state.shared.socket,
    viewdata: state.common.viewdata,
    ticketTypes: state.ticketsState.types,
    priorities: state.ticketsState.priorities,
    ticketTags: state.tagsSettings.tags,
    groups: state.groupsState.groups,
    accounts: state.accountsState.accountsCreateTicket,
    sessionUser: state.shared.sessionUser,
    settings: state.settings.settings
})

export default connect(mapStateToProps, {
    createTicket,
    fetchTicketTypes,
    getTagsWithPage,
    fetchGroups,
    fetchAccountsCreateTicket,
    fetchSettings
})(CreateTicketFromChatwootModalContainer)
