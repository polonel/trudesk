/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/9/19 9:44 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { Fragment, createRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import { each, without, uniq } from 'lodash';

import Log from '../../logger';
import axios from 'axios';
import { fetchTickets, deleteTicket, ticketEvent, unloadTickets, ticketUpdated } from 'actions/tickets';
import { fetchSearchResults } from 'actions/search';
import { showModal } from 'actions/common';
import { fetchSettings } from 'actions/settings';
import { fetchTCMs, tcmUpdated } from 'actions/tcms';
import { fetchTSortings, tSortingUpdated } from 'actions/tSorting';
import { TICKETS_ASSIGNEE_SET, TICKETS_ASSIGNEE_LOAD } from 'serverSocket/socketEventConsts';

import PageTitle from 'components/PageTitle';
import Table from 'components/Table';
import TableHeader from 'components/Table/TableHeader';
import TableRow from 'components/Table/TableRow';
import TitlePagination from 'components/TitlePagination';
import PageContent from 'components/PageContent';
import TableCell from 'components/Table/TableCell';
import PageTitleButton from 'components/PageTitleButton';
import DropdownTrigger from 'components/Dropdown/DropdownTrigger';
import Dropdown from 'components/Dropdown';
import DropdownItem from 'components/Dropdown/DropdownItem';
import DropdownSeparator from 'components/Dropdown/DropdownSeperator';
import StatusSelectorList from 'containers/Tickets/StatusSelectorList';
import AssigneeDropdownPartial from 'containers/Tickets/AssigneeDropdownPartial';
import PDropdownTrigger from 'components/PDropdown/PDropdownTrigger';
import SingleSelectStatus from 'components/SingleSelectStatus';

import helpers from 'lib/helpers';
import anime from 'animejs';
import moment from 'moment-timezone';
import SearchResults from 'components/SearchResults';

@observer
class TicketsContainer extends React.Component {
  @observable searchTerm = '';
  assigneeDropdownPartial = createRef();
  selectedTickets = [];
  constructor(props) {
    super(props);
    makeObservable(this);

    this.onTicketCommentAdded = this.onTicketCommentAdded.bind(this);
    this.onTicketsListUpdated = this.onTicketsListUpdated.bind(this);
    this.onTicketCreated = this.onTicketCreated.bind(this);
    this.onTicketUpdated = this.onTicketUpdated.bind(this);
    this.onTicketDeleted = this.onTicketDeleted.bind(this);
    this.onTCMUpdated = this.onTCMUpdated.bind(this);
    this.onTSortingUpdated = this.onTSortingUpdated.bind(this);
    this.onTSortingsFetch = this.onTSortingsFetch.bind(this);
    this.onUpdateTicketAssignee = this.onUpdateTicketAssignee.bind(this);
  }

  componentDidMount() {
    this.props.socket.on('$trudesk:tickets:comment_note:set', this.onTicketCommentAdded);
    this.props.socket.on('$trudesk:tickets:list:update', this.onTicketsListUpdated);
    this.props.socket.on('$trudesk:client:tcm:update', this.onTCMUpdated);
    this.props.socket.on('$trudesk:client:tsorting:update', this.onTSortingUpdated);
    this.props.socket.on('$trudesk:client:tsortings:fetch', this.onTSortingsFetch);
    this.props.socket.on('$trudesk:client:ticket:created', this.onTicketCreated);
    this.props.socket.on('$trudesk:client:ticket:updated', this.onTicketUpdated);
    this.props.socket.on('$trudesk:client:ticket:deleted', this.onTicketDeleted);
    this.props.fetchSettings();
    this.props.fetchTCMs();
    this.props.fetchTSortings();
    // this.props.fetchTickets({
    //   limit: 50,
    //   page: this.props.page,
    //   type: this.props.view,
    //   filter: this.props.filter,
    //   //sorting: this.props.sorting.sorting,
    // });
  }

  componentDidUpdate() {
    if (this.timeline) {
      this.timeline.pause();
      this.timeline.seek(0);
    }

    anime.remove('tr.overdue td');

    this.timeline = anime.timeline({
      direction: 'alternate',
      duration: 800,
      autoPlay: false,
      easing: 'steps(1)',
      loop: true,
      backgroundColor: 'blue',
    });

    this.timeline.add({
      targets: 'tr.overdue td',
      backgroundColor: '#b71c1c',
      color: '#ffffff',
    });

    this.timeline.play();
  }

  componentWillUnmount() {
    anime.remove('tr.overdue td');
    this.timeline = null;
    this.props.unloadTickets();
    this.props.socket.off('$trudesk:tickets:comment_note:set', this.onTicketCommentAdded);
    this.props.socket.off('$trudesk:tickets:list:update', this.onTicketsListUpdated);
    this.props.socket.off('$trudesk:client:ticket:created', this.onTicketCreated);
    this.props.socket.off('$trudesk:client:tcm:update', this.onTCMUpdated);
    this.props.socket.off('$trudesk:client:tsorting:update', this.onTSortingUpdated);
    this.props.socket.off('$trudesk:client:tsortings:fetch', this.onTSortingsFetch);
    this.props.socket.off('$trudesk:client:ticket:updated', this.onTicketUpdated);
    this.props.socket.off('$trudesk:client:ticket:deleted', this.onTicketDeleted);
  }

  onUpdateTicketAssignee(data) {
    if (this.props.ticketId === data.tid) {
      this.assignee = data.status;
      if (this.props.onStatusChange) this.props.onStatusChange(this.status);
    }
  }

  onTicketCreated(ticket) {
    if (this.props.page === '0') this.props.ticketEvent({ type: 'created', data: ticket });
  }

  onTicketUpdated(data) {
    this.props.ticketUpdated(data);
  }

  onTCMUpdated(data) {
    this.props.tcmUpdated(data);
  }

  onTicketDeleted(id) {
    this.props.ticketEvent({ type: 'deleted', data: id });
  }

  onTicketCheckChanged(e, id) {
    if (e.target.checked) this.selectedTickets.push(id);
    else this.selectedTickets = without(this.selectedTickets, id);

    this.selectedTickets = uniq(this.selectedTickets);
  }

  onTicketCommentAdded() {
    const checked = false;
    const userId = this.props.shared.sessionUser._id;
    axios
      .put(`/api/v2/tickets/checked/${this.props.ticketUid}`, { checked, userId })
      .then((res) => {
        if (res.data.success) {
          // this.props.fetchTickets({
          //   limit: 50,
          //   page: this.props.page,
          //   type: this.props.view,
          //   filter: this.props.filter,
          //   sort: this.props.sort,
          // });
          this.props.fetchTSortings();
          this._clearChecked();
        } else {
          helpers.UI.showSnackbar('An unknown error occurred.', true);
          Log.error(res.data.error);
        }
      })
      .catch((error) => {
        Log.error(error);
        helpers.UI.showSnackbar('An Error occurred. Please check console.', true);
      });
  }

  onSetStatus(status) {
    let statusText = '';
    switch (status) {
      case 0:
        statusText = 'New';
        break;
      case 1:
        statusText = 'Open';
        break;
      case 2:
        statusText = 'Pending';
        break;
      case 3:
        statusText = 'Closed';
    }

    const batch = this.selectedTickets.map((id) => {
      return { id, status };
    });

    axios
      .put(`/api/v2/tickets/batch`, { batch })
      .then((res) => {
        if (res.data.success) {
          helpers.UI.showSnackbar({ text: `Ticket status set to ${statusText}` });
          this._clearChecked();
        } else {
          helpers.UI.showSnackbar('An unknown error occurred.', true);
          Log.error(res.data.error);
        }
      })
      .catch((error) => {
        Log.error(error);
        helpers.UI.showSnackbar('An Error occurred. Please check console.', true);
      });
  }

  onDeleteClicked() {
    each(this.selectedTickets, (id) => {
      this.props.deleteTicket({ id });
    });

    this._clearChecked();
  }

  sortData = (field) => {
    if (field == '#') field = 'uid';
    const data = {
      sorting: field,
      userId: this.props.sessionUser._id,
    };

    this.props.tSortingUpdated(data);
    // this.props.fetchTickets({
    //   limit: 50,
    //   page: this.props.page,
    //   type: this.props.view,
    //   filter: this.props.filter,
    //   sorting: field.toLowerCase(),
    // });
  };

  onTSortingUpdated = (data) => {
    this.props.fetchTickets({
      limit: 50,
      page: this.props.page,
      type: this.props.view,
      filter: this.props.filter,
      sorting: data.tSorting.sorting.toLowerCase(),
      direction: data.tSorting.direction,
    });
  };

  onTSortingsFetch = (data) => {
    if (this.props.sessionUser) {
      const userId = this.props.sessionUser._id;
      const tSorting = data.tSortings.find((tSorting) => tSorting.userId == userId);
      if (tSorting) {
        this.props.fetchTickets({
          limit: 50,
          page: this.props.page,
          type: this.props.view,
          filter: this.props.filter,
          sorting: tSorting.sorting.toLowerCase(),
          direction: tSorting.direction,
        });
      } else {
        this.props.fetchTickets({
          limit: 50,
          page: this.props.page,
          type: this.props.view,
          filter: this.props.filter,
        });
      }
    } else {
      this.props.fetchTSortings({
        limit: 50,
        page: this.props.page,
        type: this.props.view,
        filter: this.props.filter,
      });
    }
  };

  getSetting(stateName) {
    return this.props.settings.getIn(['settings', stateName, 'value'])
      ? this.props.settings.getIn(['settings', stateName, 'value'])
      : '';
  }

  onSearchTermChanged(e) {
    this.searchTerm = e.target.value;
    if (this.searchTerm.length > 3) {
      SearchResults.toggleAnimation(true, true);
      this.props.fetchSearchResults({ term: this.searchTerm });
    } else {
      SearchResults.toggleAnimation(true, false);
    }
  }

  _onSearchFocus(e) {
    if (this.searchTerm.length > 3) SearchResults.toggleAnimation(true, true);
  }

  onSearchKeypress(e) {
    if (this.searchTerm.length > 3) this.props.fetchSearchResults({ term: this.searchTerm });

    // e.persist()
    // if (e.charCode === 13) {
    //   const searchString = e.target.value
    //   if (searchString.length < 1) this.props.unloadTickets().then(this.props.fetchTickets({ type: this.props.view }))
    //   else this.props.unloadTickets().then(this.props.fetchTickets({ type: 'search', searchString }))
    // }
  }

  sendNotification(ticket) {
    const siteURL = this.getSetting('siteUrl');
    if (this.getSetting('chatwootSettings')) {
      axios.get(`/api/v1/users/${ticket.get('owner').get('username')}`).then((response) => {
        console.log(JSON.stringify(response.data));
      });
    }
  }
  _selectAll() {
    this.selectedTickets = [];
    const checkboxes = this.ticketsTable.querySelectorAll('td > input[type="checkbox"]');
    checkboxes.forEach((item) => {
      this.selectedTickets.push(item.dataset.ticket);
      item.checked = true;
    });

    this.selectedTickets = uniq(this.selectedTickets);
  }

  _clearChecked() {
    this.selectedTickets = [];
    const checkboxes = this.ticketsTable.querySelectorAll('td > input[type="checkbox"]');
    checkboxes.forEach((item) => {
      item.checked = false;
    });

    this.selectAllCheckbox.checked = false;
  }

  onSelectAll(e) {
    if (e.target.checked) this._selectAll();
    else this._clearChecked();
  }

  onTicketsListUpdated() {
    // this.props.fetchTickets({
    //   limit: 50,
    //   page: this.props.page,
    //   type: this.props.view,
    //   filter: this.props.filter,
    //   //sorting: this.props.sorting,
    // });
    this.props.fetchTSortings();
  }

  changeAssignee(ticketId, assignee) {
    // if (!this.props.hasPerm) return;
    this.props.socket.emit(TICKETS_ASSIGNEE_SET, { _id: assignee, ticketId: ticketId });
    //this.forceClose();
  }

  render() {
    const loadingItems = [];
    for (let i = 0; i < 51; i++) {
      const cells = [];
      for (let k = 0; k < 10; k++) {
        cells.push(
          <TableCell key={k} className={'vam'}>
            <div className={'loadingTextAnimation'} />
          </TableCell>
        );
      }

      loadingItems.push(<TableRow key={Math.random()}>{cells}</TableRow>);
    }
    const selectAllCheckbox = (
      <div style={{ marginLeft: 17 }}>
        <input
          type="checkbox"
          id={'select_all'}
          style={{ display: 'none' }}
          className="svgcheckinput"
          onChange={(e) => this.onSelectAll(e)}
          ref={(r) => (this.selectAllCheckbox = r)}
        />
        <label htmlFor={'select_all'} className="svgcheck">
          <svg width="16px" height="16px" viewBox="0 0 18 18">
            <path d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z" />
            <polyline points="1 9 7 14 15 4" />
          </svg>
        </label>
      </div>
    );

    return (
      <div>
        <PageTitle
          title={'Tickets'}
          shadow={false}
          rightComponent={
            <div>
              <div className={'uk-float-right'}>
                <TitlePagination
                  limit={50}
                  total={this.props.totalCount}
                  type={this.props.view}
                  prevEnabled={this.props.prevEnabled}
                  nextEnabled={this.props.nextEnabled}
                  currentPage={this.props.page}
                  prevPage={this.props.prevPage}
                  nextPage={this.props.nextPage}
                  filter={this.props.filter}
                />
                <PageTitleButton
                  fontAwesomeIcon={'fa-refresh'}
                  onButtonClick={(e) => {
                    e.preventDefault();
                    this.props
                      .unloadTickets()
                      // .then(this.props.fetchTickets({ type: this.props.view, page: this.props.page }));
                      .then(this.props.fetchTSortings());
                  }}
                />
                <PageTitleButton
                  fontAwesomeIcon={'fa-filter'}
                  onButtonClick={(e) => {
                    e.preventDefault();
                    this.props.showModal('FILTER_TICKET');
                  }}
                />
                <DropdownTrigger pos={'bottom-right'} offset={5} extraClass={'uk-float-left'}>
                  <PageTitleButton fontAwesomeIcon={'fa-tasks'} />
                  <Dropdown small={true} width={120}>
                    <DropdownItem text={'Create'} onClick={() => this.props.showModal('CREATE_TICKET')} />
                    <DropdownSeparator />
                    <DropdownItem text={'Set Open'} onClick={() => this.onSetStatus(1)} />
                    <DropdownItem text={'Set Pending'} onClick={() => this.onSetStatus(2)} />
                    <DropdownItem text={'Set Closed'} onClick={() => this.onSetStatus(3)} />
                    {helpers.canUser('tickets:delete', true) && <DropdownSeparator />}
                    {helpers.canUser('tickets:delete', true) && (
                      <DropdownItem text={'Delete'} extraClass={'text-danger'} onClick={() => this.onDeleteClicked()} />
                    )}
                  </Dropdown>
                </DropdownTrigger>

                <div className={'uk-float-right'}>
                  <div
                    id={'ticket-search-box'}
                    className="search-box uk-float-left nb"
                    style={{ marginTop: 8, paddingLeft: 0 }}
                  >
                    {this.getSetting('elasticSearchEnabled') && (
                      <input
                        type="text"
                        id="tickets_Search"
                        placeholder={'Search'}
                        className={'ticket-top-search'}
                        value={this.searchTerm}
                        onChange={(e) => this.onSearchTermChanged(e)}
                        onFocus={(e) => this._onSearchFocus(e)}
                      />
                    )}
                  </div>
                </div>
              </div>
              <SearchResults target={'#ticket-search-box'} ref={(r) => (this.searchContainer = r)} />
            </div>
          }
        />
        <PageContent padding={0} paddingBottom={0} extraClass={'uk-position-relative'}>
          {/*<SpinLoader active={this.props.loading} />*/}
          <Table
            tableRef={(ref) => (this.ticketsTable = ref)}
            style={{ margin: 0 }}
            extraClass={'pDataTable'}
            stickyHeader={true}
            striped={true}
            headers={[
              <TableHeader key={0} width={45} height={50} component={selectAllCheckbox} />,
              <TableHeader sortData={this.sortData} key={1} width={67} text={'Status'} />,
              <TableHeader sortData={this.sortData} key={2} width={65} text={'#'} />,
              <TableHeader sortData={this.sortData} key={3} width={'12%'} text={'Subject'} />,
              <TableHeader sortData={this.sortData} key={4} width={110} text={'Created'} />,
              <TableHeader sortData={this.sortData} key={5} width={170} text={'Requester'} />,
              <TableHeader sortData={this.sortData} key={6} width={175} text={'Customer'} />,
              <TableHeader sortData={this.sortData} key={7} text={'Assignee'} />,
              <TableHeader sortData={this.sortData} key={8} width={110} text={'Due Date'} />,
              <TableHeader sortData={this.sortData} key={9} text={'Updated'} />,
            ]}
          >
            {/* {!this.props.loading && this.props.tickets.size < 1 && ( */}
            {!this.props.loading && this.props.tickets.size < 1 && (
              <TableRow clickable={false}>
                <TableCell colSpan={10}>
                  <h5 style={{ margin: 10 }}>No Tickets Found</h5>
                </TableCell>
              </TableRow>
            )}
            {this.props.loading && loadingItems}
            {!this.props.loading &&
              this.props.tickets.map((ticket) => {
                const status = () => {
                  switch (ticket.get('status')) {
                    case 0:
                      return 'new';
                    case 1:
                      return 'open';
                    case 2:
                      return 'pending';
                    case 3:
                      return 'closed';
                  }
                };

                const statusChecked = () => {
                  let checked = false;
                  this.props.tcms.map((tcm) => {
                    tcm.get('users').map((userId) => {
                      if (tcm.get('ticketId') == ticket.get('_id') && userId == this.props.sessionUser._id) {
                        checked = true;
                      }
                    });
                  });
                  switch (ticket.get('status')) {
                    case 0:
                      if (!checked) return 'new';
                      return 'open';
                    case 1:
                      if (!checked) return 'new';
                      return 'open';
                    case 2:
                      if (!checked) return 'new';
                      return 'pending';
                    case 3:
                      return 'closed';
                  }
                };

                const assignee = () => {
                  const a = ticket.get('assignee');
                  return !a ? '--' : a.get('fullname');
                };

                const updated = ticket.get('updated')
                  ? helpers.formatDate(ticket.get('updated'), helpers.getShortDateFormat()) +
                    ', ' +
                    helpers.formatDate(ticket.get('updated'), helpers.getTimeFormat())
                  : '--';

                const dueDate = ticket.get('dueDate')
                  ? helpers.formatDate(ticket.get('dueDate'), helpers.getShortDateFormat())
                  : '--';

                const isOverdue = () => {
                  if (!this.props.common.viewdata.get('showOverdue') || [2, 3].indexOf(ticket.get('status')) !== -1)
                    return false;
                  const overdueIn = ticket.getIn(['priority', 'overdueIn']);
                  const now = moment();
                  let updated = ticket.get('updated');
                  if (updated) updated = moment(updated);
                  else updated = moment(ticket.get('date'));

                  const timeout = updated.clone().add(overdueIn, 'm');
                  return now.isAfter(timeout);
                };
                const hasTicketUpdate = this.ticket && this.ticket.status !== 3 && helpers.canUser('tickets:update');
                const hasTicketElementUpdate = (ticket) => {
                  const isAgent = this.props.sessionUser ? this.props.sessionUser.role.isAgent : false;
                  const isAdmin = this.props.sessionUser ? this.props.sessionUser.role.isAdmin : false;
                  if (isAgent || isAdmin) {
                    return helpers.canUser('tickets:update');
                  } else {
                    if (!ticket || !this.props.sessionUser) return false;
                    return helpers.hasPermOverRole(
                      ticket.get('owner').role,
                      this.props.sessionUser.role,
                      'tickets:update',
                      false
                    );
                  }
                };

                return (
                  <TableRow
                    key={ticket.get('_id')}
                    className={`ticket-${statusChecked()} ${isOverdue() ? 'overdue' : ''} tableRowHover`}
                    clickable={true}
                    onClick={(e) => {
                      if (e.target.tagName !== 'SPAN') {
                        const td = e.target.closest('td');
                        const input = td.getElementsByTagName('input');
                        if (input.length > 0) return false;
                        History.pushState(null, `Ticket-${ticket.get('uid')}`, `/tickets/${ticket.get('uid')}`);
                      }
                    }}
                  >
                    <TableCell
                      className={'ticket-priority nbb vam'}
                      style={{ borderColor: ticket.getIn(['priority', 'htmlColor']), padding: '18px 15px' }}
                    >
                      <input
                        type="checkbox"
                        id={`c_${ticket.get('_id')}`}
                        data-ticket={ticket.get('_id')}
                        style={{ display: 'none' }}
                        onChange={(e) => this.onTicketCheckChanged(e, ticket.get('_id'))}
                        className="svgcheckinput"
                      />
                      <label htmlFor={`c_${ticket.get('_id')}`} className="svgcheck">
                        <svg width="16px" height="16px" viewBox="0 0 18 18">
                          <path d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z" />
                          <polyline points="1 9 7 14 15 4" />
                        </svg>
                      </label>
                    </TableCell>
                    <TableCell className={`ticket-status ticket-${status()} vam nbb uk-text-center`}>
                      <StatusSelectorList
                        ticketId={ticket.get('_id')}
                        status={ticket.get('status')}
                        socket={this.props.socket}
                        onStatusChange={(status) => {
                          this.sendNotification(ticket);
                        }}
                        hasPerm={hasTicketElementUpdate(ticket)}
                      />
                    </TableCell>
                    <TableCell className={'vam nbb'}>{ticket.get('uid')}</TableCell>
                    <TableCell
                      className={'vam nbb'}
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      data-toggle={'tooltip'}
                      data-placement={'bottom'}
                      title={ticket.get('subject')}
                      delay={0}
                    >
                      {ticket.get('subject')}
                    </TableCell>
                    <TableCell className={'vam nbb'}>
                      {helpers.formatDate(ticket.get('date'), helpers.getShortDateFormat())}
                    </TableCell>
                    <TableCell className={'vam nbb'}>{ticket.getIn(['owner', 'fullname'])}</TableCell>
                    <TableCell className={'vam nbb'}>{ticket.getIn(['group', 'name'])}</TableCell>
                    <TableCell className={'vam nbb'}>
                      <span
                        role="button"
                        title="Set Assignee"
                        // style={{ float: 'left' }}
                        // className="relative no-ajaxy"
                        onClick={() => this.props.socket.emit(TICKETS_ASSIGNEE_LOAD)}
                      >
                        {assignee()}
                        <PDropdownTrigger target={this.assigneeDropdownPartial}>
                          <Avatar
                            image={ticket.get('assignee') && ticket.get('assignee').get('image')}
                            //showOnlineBubble={this.ticket.assignee !== undefined}
                            userId={ticket.get('assignee') && ticket.get('assignee').get('_id')}
                          />
                          <span className="drop-icon material-icons">keyboard_arrow_down</span>
                        </PDropdownTrigger>
                      </span>
                      <span
                        className="drop-icon material-icons"
                        style={{ left: 20, top: 15, paddingLeft: 10, left: 'auto' }}
                        onClick={() => {
                          this.changeAssignee(ticket.get('_id'), this.props.sessionUser._id);
                        }}
                        hasPerm={hasTicketElementUpdate(ticket)}
                      >
                        back_hand
                      </span>
                      <div className="ticket-assignee-wrap uk-clearfix" style={{ paddingRight: 30 }}>
                        {hasTicketUpdate && (
                          <AssigneeDropdownPartial
                            forwardedRef={this.assigneeDropdownPartial}
                            ticketId={ticket.get('_id')}
                            // onClearClick={() => (ticket.get('assignee') = undefined)}
                            // onAssigneeClick={({ agent }) => (this.ticket.assignee = agent)}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={'vam nbb'}>{dueDate}</TableCell>
                    <TableCell className={'vam nbb'}>{updated}</TableCell>
                  </TableRow>
                );
              })}
          </Table>
        </PageContent>
      </div>
    );
  }
}

TicketsContainer.propTypes = {
  socket: PropTypes.object.isRequired,
  view: PropTypes.string.isRequired,
  page: PropTypes.string.isRequired,
  prevPage: PropTypes.number.isRequired,
  nextPage: PropTypes.number.isRequired,
  prevEnabled: PropTypes.bool.isRequired,
  nextEnabled: PropTypes.bool.isRequired,
  tickets: PropTypes.object.isRequired,
  totalCount: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchTickets: PropTypes.func.isRequired,
  fetchTCMs: PropTypes.func.isRequired,
  deleteTicket: PropTypes.func.isRequired,
  ticketEvent: PropTypes.func.isRequired,
  unloadTickets: PropTypes.func.isRequired,
  ticketUpdated: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  fetchSearchResults: PropTypes.func.isRequired,
  common: PropTypes.object.isRequired,
  filter: PropTypes.object.isRequired,
};

TicketsContainer.defaultProps = {
  view: 'active',
  page: 0,
  prevEnabled: true,
  nextEnabled: true,
};

const mapStateToProps = (state) => ({
  tickets: state.ticketsState.tickets,
  tcms: state.tcmsState.tcms,
  totalCount: state.ticketsState.totalCount,
  prevPage: state.ticketsState.prevPage,
  nextPage: state.ticketsState.nextPage,
  loading: state.ticketsState.loading,
  common: state.common,
  socket: state.shared.socket,
  settings: state.settings.settings,
  sessionUser: state.shared.sessionUser,
});

export default connect(mapStateToProps, {
  fetchTCMs,
  fetchTickets,
  fetchTSortings,
  fetchSettings,
  fetchSearchResults,
  deleteTicket,
  ticketEvent,
  ticketUpdated,
  tcmUpdated,
  tSortingUpdated,
  unloadTickets,
  showModal,
})(TicketsContainer);
