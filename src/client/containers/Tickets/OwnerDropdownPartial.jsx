/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/23/19 1:25 AM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import TruCard from 'components/TruCard';
import GridItem from 'components/Grid/GridItem';
import { TICKETS_ASSIGNEE_LOAD, TICKETS_ASSIGNEE_SET, TICKETS_ASSIGNEE_CLEAR } from 'serverSocket/socketEventConsts';
import { fetchAccounts } from 'actions/accounts';
import Avatar from 'components/Avatar/Avatar';
import PDropDownAccount from 'components/PDropdown/PDropDownAccount';

import helpers from 'lib/helpers';

@observer
class OwnerDropdownPartial extends React.Component {
  constructor(props) {
    super(props);
    makeObservable(this);
  }

  componentDidMount() {
    this.props.fetchAccounts({ limit: -1, search: this.props.user.email });
    console.log('this.props');
    console.log(this.props);
  }

  componentWillUnmount() {}

  render() {
    let topOffset;
    if (this.props.topOffset) {
      topOffset = this.props.topOffset;
    } else topOffset = 75;
    const userImage = this.props.user.image || 'defaultProfile.jpg';
    const isAdmin = this.props.user.role.name == 'Admin' || false;
    const isAgent = this.props.user.role.name == 'Support' || false;
    const isDeleted = this.props.deleted || false;
    const customer = !isAdmin && !isAgent;
    console.log('this.props.accountsState');
    console.log(this.props.accountsState);

    return (
      <PDropDownAccount
        ref={this.props.forwardedRef}
        id={'assigneeDropdown'}
        override={true}
        leftArrow={true}
        // topOffset={topOffset}
        // leftOffset={35}
        // minHeight={215}
      >
        {this.props.accountsState.accounts &&
          this.props.accountsState.accounts.map((user) => {
            <GridItem key={user.get('_id')}>
              <TruCard
                loaderActive={user.get('loading')}
                menu={actionMenu}
                extraHeadClass={
                  (isAdmin ? 'tru-card-head-admin' : '') +
                  (!isAdmin && isAgent ? 'tru-card-head-agent' : '') +
                  (isDeleted ? ' tru-card-head-deleted' : '')
                }
                header={
                  <div>
                    <div className="account-image relative uk-display-inline-block">
                      <Avatar
                        size={82}
                        userId={user.get('_id')}
                        image={userImage}
                        style={{ marginTop: 10 }}
                        showBorder={true}
                        borderColor={'#ffffff'}
                        showLargerBubble={true}
                      />
                    </div>
                    <h3 className="tru-card-head-text uk-text-center">
                      {user.get('fullname')}
                      <span className="uk-text-truncate">{user.get('title')}</span>
                    </h3>
                  </div>
                }
                content={
                  <ul className="tru-list">
                    <li>
                      <div className="tru-list-content">
                        <span className="tru-list-heading">Role</span>
                        <span className="uk-text-small uk-text-muted">{user.getIn(['role', 'name'])}</span>
                      </div>
                    </li>
                    <li>
                      <div className="tru-list-content">
                        <span className="tru-list-heading">Email</span>
                        <span className="uk-text-small uk-text-muted">
                          <a href={`mailto:${user.get('email')}`}>{user.get('email')}</a>
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="tru-list-content">
                        <span className="tru-list-heading">Phone</span>
                        <a href={`tel:${user.get('phone')}`}>{user.get('phone')}</a>
                      </div>
                    </li>
                    <li>
                      {customer && user.get('groups') && (
                        <div className="tru-list-content">
                          <span className="tru-list-heading">Groups</span>
                          <span className="uk-text-small uk-text-muted uk-text-truncate">
                            {user.get('groups').map((group) => {
                              return group.get('name') + (user.get('groups').toArray().length > 1 ? ', ' : '');
                            })}
                          </span>
                        </div>
                      )}
                      {!customer && user.get('teams') && (
                        <div className="tru-list-content">
                          <span className="tru-list-heading">Teams</span>
                          <span className="uk-text-small uk-text-muted uk-text-truncate">
                            {user.get('teams').map((team) => {
                              return team.get('name') + (user.get('teams').toArray().length > 1 ? ', ' : '');
                            })}
                          </span>
                        </div>
                      )}
                    </li>
                    {!customer && user.get('departments') && (
                      <li>
                        <div className="tru-list-content">
                          <span className="tru-list-heading">Departments</span>
                          <span className="uk-text-small uk-text-muted uk-text-truncate">
                            {user.get('departments').map((department) => {
                              return (
                                department.get('name') + (user.get('departments').toArray().length > 1 ? ', ' : '')
                              );
                            })}
                          </span>
                        </div>
                      </li>
                    )}
                  </ul>
                }
              />
            </GridItem>;
          })}
      </PDropDownAccount>
    );
  }
}

OwnerDropdownPartial.propTypes = {
  ticketId: PropTypes.string.isRequired,
  onClearClick: PropTypes.func,
  onAssigneeClick: PropTypes.func,
  socket: PropTypes.object.isRequired,
  forwardedRef: PropTypes.any.isRequired,
};

const mapStateToProps = (state) => ({
  socket: state.shared.socket,
  accountsState: state.accountsState,
});

export default connect(mapStateToProps, { fetchAccounts }, null, { forwardRef: true })(OwnerDropdownPartial);
