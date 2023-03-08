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

import Avatar from 'components/Avatar/Avatar';
import PDropDown from 'components/PDropdown';

import helpers from 'lib/helpers';

@observer
class OwnerDropdownPartial extends React.Component {
  constructor(props) {
    super(props);
    makeObservable(this);
  }

  componentDidMount() {
    console.log('this.props');
    console.log(this.props);
  }

  componentWillUnmount() {}

  render() {
    // let topOffset;
    // if (this.props.topOffset) {
    //   topOffset = this.props.topOffset;
    // } else topOffset = 75;
    const isAdmin = this.props.user.role.name == 'Admin' || false;
    const isAgent = this.props.user.role.name == 'Support' || false;
    const customer = !isAdmin && !isAgent;
    console.log('this.props');
    console.log(this.props.user._id);
    console.log(this.props.user.fullname);
    return (
      <PDropDown
        ref={this.props.forwardedRef}
        title={'Select Assignee'}
        id={'assigneeDropdown'}
        className={'opt-ignore-notice'}
        override={true}
        leftArrow={true}
        // topOffset={topOffset}
        leftOffset={35}
        minHeight={215}
      >
        {this.props.user && (
          <GridItem key={this.props.user._id} width={'1-5'} xLargeWidth={'1-6'} extraClass={'mb-25'}>
            <TruCard
              loaderActive={this.props.user.loading}
              header={
                <div>
                  <h3 className="tru-card-head-text uk-text-center">
                    {this.props.user.fullname}
                    <span className="uk-text-truncate">{this.props.user.title}</span>
                  </h3>
                </div>
              }
              content={
                <ul className="tru-list">
                  <li>
                    <div className="tru-list-content">
                      <span className="tru-list-heading">Role</span>
                      <span className="uk-text-small uk-text-muted">{this.props.user.role.name}</span>
                    </div>
                  </li>
                  <li>
                    <div className="tru-list-content">
                      <span className="tru-list-heading">Email</span>
                      <span className="uk-text-small uk-text-muted">
                        <a href={`mailto:${this.props.user.email}`}>{this.props.user.email}</a>
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="tru-list-content">
                      <span className="tru-list-heading">Phone</span>
                      <a href={`tel:${this.props.user.phone}`}>{this.props.user.phone}</a>
                    </div>
                  </li>
                  <li>
                    {customer && this.props.user.groups && (
                      <div className="tru-list-content">
                        <span className="tru-list-heading">Groups</span>
                        <span className="uk-text-small uk-text-muted uk-text-truncate">
                          {this.props.user.groups.map((group) => {
                            return group.name + (this.props.user.groups.toArray().length > 1 ? ', ' : '');
                          })}
                        </span>
                      </div>
                    )}
                    {!customer && this.props.user.teams && (
                      <div className="tru-list-content">
                        <span className="tru-list-heading">Teams</span>
                        <span className="uk-text-small uk-text-muted uk-text-truncate">
                          {this.props.user.teams.map((team) => {
                            return team.name + (this.props.user.teams.toArray().length > 1 ? ', ' : '');
                          })}
                        </span>
                      </div>
                    )}
                  </li>
                  {!customer && this.props.user.departments && (
                    <li>
                      <div className="tru-list-content">
                        <span className="tru-list-heading">Departments</span>
                        <span className="uk-text-small uk-text-muted uk-text-truncate">
                          {this.props.user.departments.map((department) => {
                            return department.name + (this.props.user.departments.toArray().length > 1 ? ', ' : '');
                          })}
                        </span>
                      </div>
                    </li>
                  )}
                </ul>
              }
            />
          </GridItem>
        )}
      </PDropDown>
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
});

export default connect(mapStateToProps, {}, null, { forwardRef: true })(OwnerDropdownPartial);
