import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import { connect } from 'react-redux';
import Button from 'components/Button';
import BaseModal from 'containers/Modals/BaseModal';
import { updateSetting } from 'actions/settings';
import { fetchBlackList, addEmail } from 'actions/blacklist';
import { fetchAccounts } from 'actions/accounts';
import InfiniteScroll from 'react-infinite-scroller';
import Log from '../../logger';
import axios from 'axios';
import Table from 'components/Table';
import TableHeader from 'components/Table/TableHeader';
import TableRow from 'components/Table/TableRow';
import PageContent from 'components/PageContent';
import TableCell from 'components/Table/TableCell';
@observer
class BlackListModal extends React.Component {
  @observable privacyPolicy = '';
  @observable pageStart = -1;
  @observable hasMore = true;
  @observable initialLoad = true;
  @observable blacklist = [];
  constructor(props) {
    super(props);

    makeObservable(this);
  }

  getSetting(stateName) {
    return this.props.settings.getIn(['settings', stateName, 'value'])
      ? this.props.settings.getIn(['settings', stateName, 'value'])
      : '';
  }

  componentDidMount() {
    console.log('fetchBlackList');

    this.props.fetchBlackList({ limit: 10, skip: this.blacklist.length }).then(({ response }) => {
      this.hasMore = response.count >= 5;
    });
    this.initialLoad = false;
  }

  componentDidUpdate(prevProps) {
    // helpers.UI.reRenderInputs()
  }

  addEmail(email) {
    this.blacklist.push(email);

    this.props.addEmail(payload);
  }

  removeEmail(email) {
    this.blacklist.splice(email);
  }

  getEmailsWithPage(page) {
    this.hasMore = false;
    this.props
      .fetchBlackList({ page, limit: 5, skip: this.blacklist.length, type: this.props.view, showDeleted: true })
      .then(({ response }) => {
        this.hasMore = response.count >= 5;
      });
  }

  onFormSubmit() {
    console.log('onFormSubmit');
    const payload = {
      email: 'email@email.com',
      reason: 'Причина блокировки',
    };
    this.props.addEmail(payload);
    // this.props.updateSetting({
    //   name: 'mailer:blacklist',
    //   value: this.blacklist,
    //   stateName: 'milerBlacklist',
    // });
  }

  render() {
    return (
      <BaseModal options={{}}>
        <div className="setting-item-wrap uk-margin-medium-bottom">
          <div style={{ minHeight: '60px', height: 'auto' }}>
            <div>
              <div className="uk-position-relative">
                <div>
                  <div>
                    <h2 className="uk-text-muted uk-text-center">Black list</h2>
                  </div>
                </div>

                <table className="uk-table mt-0 mb-5">
                  <thead>
                    <tr>
                      <th></th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* {deletedTickets.map((ticket) => ( */}

                    <tr>
                      <td className="valign-middle" style={{ width: '5%', height: '30px' }}>
                        1
                      </td>
                      <td className="valign-middle" style={{ width: '95%' }}>
                        Email@email.ru
                      </td>

                      <td className="uk-text-right valign-middle">
                        <div className="md-btn-group">
                          <button className="md-btn md-btn-small md-btn-wave" onClick={() => this.onFormSubmit()}>
                            Add
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* ))} */}
                  </tbody>
                </table>
                <PageContent id={'mapping-page-content'} padding={0}>
                  <InfiniteScroll
                    pageStart={this.pageStart}
                    loadMore={this.getEmailsWithPage}
                    hasMore={true}
                    initialLoad={this.initialLoad}
                    threshold={5}
                    loader={
                      <div className={'uk-width-1-1 uk-text-center'} key={0}>
                        <i className={'uk-icon-refresh uk-icon-spin'} />
                      </div>
                    }
                    useWindow={false}
                    getScrollParent={() => document.getElementById('mapping-page-content')}
                  >
                    <Table
                      style={{ margin: 0 }}
                      extraClass={'pDataTable'}
                      stickyHeader={true}
                      striped={true}
                      headers={[
                        <TableHeader key={1} width={'20%'} text={'Email'} />,
                        <TableHeader key={2} width={'20%'} text={'Reason'} />,
                      ]}
                    >
                      {this.props.blacklist.length !== 0 &&
                        this.props.blacklist.map((value) => {
                          return (
                            <TableRow key={this.props.blacklist.indexOf(email) + 1} clickable={true}>
                              <TableCell className={'vam nbb'}>
                                <div key={this.props.blacklist.indexOf(email) + 1} className={'uk-float-left'}>
                                  {value.email}
                                </div>
                              </TableCell>
                              <TableCell className={'vam nbb'}>
                                <div key={this.props.blacklist.indexOf(email) + 1} className={'uk-float-left'}>
                                  {value.reason}
                                </div>
                              </TableCell>
                              <TableCell className={'vam nbb'}>{email}</TableCell>
                            </TableRow>
                          );
                        })}
                    </Table>
                  </InfiniteScroll>
                </PageContent>
                <div className="uk-pagination deletedTicketPagination"></div>
              </div>
            </div>
          </div>
        </div>
      </BaseModal>
    );
  }
}

BlackListModal.propTypes = {
  updateSetting: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  settings: state.settings.settings,
  blacklist: state.blacklistState,
});

export default connect(mapStateToProps, { updateSetting, fetchBlackList, addEmail })(BlackListModal);
