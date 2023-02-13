/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/24/19 6:33 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import { observable, makeObservable } from 'mobx';
import Avatar from 'components/Avatar/Avatar';
import helpers from 'lib/helpers';
import { TICKETS_STATUS_SET, TICKETS_UI_STATUS_UPDATE } from 'serverSocket/socketEventConsts';
import { TICKETS_ASSIGNEE_SET, TICKETS_ASSIGNEE_LOAD, TICKETS_ASSIGNEE_CLEAR } from 'serverSocket/socketEventConsts';

const statusToName = (status) => {
  switch (status) {
    case 0:
      return 'New';
    case 1:
      return 'Open';
    case 2:
      return 'Pending';
    case 3:
      return 'Closed';
  }
};

@observer
class StatusSelectorList extends React.Component {
  @observable status = null;
  @observable assignee = null;
  @observable agents = [];

  constructor(props) {
    super(props);
    makeObservable(this);

    this.status = this.props.status;
    this.assignee = this.props.assignee;

    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onUpdateTicketStatus = this.onUpdateTicketStatus.bind(this);
  }

  componentDidMount() {
    document.addEventListener('click', this.onDocumentClick);
    this.props.socket.on(TICKETS_ASSIGNEE_LOAD, this.onUpdateAssigneeList);
    this.props.socket.on(TICKETS_UI_STATUS_UPDATE, this.onUpdateTicketStatus);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.status !== this.props.status) this.status = this.props.status;
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onDocumentClick);
    this.props.socket.off(TICKETS_ASSIGNEE_LOAD, this.onUpdateAssigneeList);
    this.props.socket.off(TICKETS_UI_STATUS_UPDATE, this.onUpdateTicketStatus);
  }

  onDocumentClick(e) {
    if (!this.selectorButton.contains(e.target) && this.dropMenu.classList.contains('shown')) this.forceClose();
  }

  onUpdateTicketStatus(data) {
    if (this.props.ticketId === data.tid) {
      this.status = data.status;
      if (this.props.onStatusChange) this.props.onStatusChange(this.status);
    }
  }

  toggleDropMenu(e) {
    e.stopPropagation();
    if (!this.props.hasPerm) return;
    const hasHide = this.dropMenu.classList.contains('hide');
    const hasShown = this.dropMenu.classList.contains('shown');
    hasHide ? this.dropMenu.classList.remove('hide') : this.dropMenu.classList.add('hide');
    hasShown ? this.dropMenu.classList.remove('shown') : this.dropMenu.classList.add('shown');
  }

  forceClose() {
    this.dropMenu.classList.remove('shown');
    this.dropMenu.classList.add('hide');
  }

  onUpdateAssigneeList(data) {
    console.log('onUpdateAssigneeList');
    console.log('this.props.ticketId');
    console.log(this.props.ticketId);
    if (this.props.ticketId == data.ticketId) {
      console.log('onUpdateAssigneeList');
      this.agents = data.sortedUser || [];
    }
  }

  changeStatus(status) {
    if (!this.props.hasPerm) return;
    this.props.socket.emit(TICKETS_STATUS_SET, { _id: this.props.ticketId, value: status });
    this.forceClose();
  }

  render() {
    return (
      <div className="floating-ticket-status" style={{ height: 94 }}>
        <div
          title="Change Status"
          className={clsx(
            `ticket-status-list`,
            `ticket-status-list ticket-${statusToName(this.status).toLowerCase()}`,
            this.props.hasPerm && `cursor-pointer`
          )}
          onClick={(e) => {
            this.props.socket.emit(TICKETS_ASSIGNEE_LOAD, { ticketId: this.props.ticketId });
            this.toggleDropMenu(e);
          }}
          ref={(r) => (this.selectorButton = r)}
          style={{ width: 25 }}
        >
          <span style={{ width: 25, marginTop: -9 }}>{this.assignee}</span>
        </div>

        <div id={'statusSelectList'} ref={(r) => (this.dropMenu = r)} className="hide">
          <ul>
            {this.agents.map((agent) => {
              return (
                <li
                  key={agent._id}
                  onClick={() => {
                    if (this.props.onAssigneeClick) this.props.onAssigneeClick({ agent });
                    helpers.hideAllpDropDowns();
                    this.props.socket.emit(TICKETS_ASSIGNEE_SET, { _id: agent._id, ticketId: this.props.ticketId });
                  }}
                >
                  <a className="messageNotification no-ajaxy" role="button">
                    <div className="uk-clearfix">
                      <Avatar userId={agent._id} image={agent.image} size={50} />
                      <div className="messageAuthor">
                        <strong>{agent.fullname}</strong>
                      </div>
                      <div className="messageSnippet">
                        <span>{agent.email}</span>
                      </div>
                      <div className="messageDate">{agent.title}</div>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}

StatusSelectorList.propTypes = {
  ticketId: PropTypes.string.isRequired,
  status: PropTypes.number.isRequired,
  onStatusChange: PropTypes.func,
  hasPerm: PropTypes.bool.isRequired,
  socket: PropTypes.object.isRequired,
};

StatusSelectorList.defaultProps = {
  hasPerm: false,
};

export default StatusSelectorList;
