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
  @observable pageStart = -1;
  @observable initialState = [];
  constructor(props) {
    super(props);

    makeObservable(this);
    this.getEmailsWithPage = this.getEmailsWithPage.bind(this);
  }

  componentDidMount() {
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
    this.props.fetchBlackList({ limit: 10, skip: this.blacklist.length }).then(({ response }) => {
      this.hasMore = response.count >= 5;
    });
  }

  onFormSubmit() {
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
    console.log('this.props.blacklistState');
    console.log(this.props.blacklistState.blacklist);
    return (
      <BaseModal options={{}}>
        <form className="uk-form-stacked" onSubmit={(e) => this.onFormSubmit(e)} style={{ position: 'center' }}>
          <div className="setting-item-wrap uk-margin-medium-bottom">
            <div style={{ minHeight: '60px', height: 'auto' }}>
              <div>
                <div className="uk-position-relative">
                  <div>
                    <div>
                      <h2 className="uk-text-muted uk-text-center">Black list</h2>
                    </div>
                  </div>
                  <InfiniteScroll
                    pageStart={this.pageStart}
                    loadMore={this.getEmailsWithPage}
                    hasMore={this.hasMore}
                    initialLoad={this.initialLoad}
                    threshold={10}
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
                        <TableHeader key={2} width={'40%'} text={'Reason'} />,
                        <TableHeader key={2} width={'20%'} text={'Action'} />,
                      ]}
                    >
                      {this.props.blacklistState.blacklist &&
                        this.props.blacklistState.blacklist.map((value) => {
                          return (
                            <TableRow key={this.props.blacklistState.blacklist.indexOf(value) + 1} clickable={true}>
                              <TableCell className={'vam nbb'}>
                                <div
                                  key={this.props.blacklistState.blacklist.indexOf(value) + 1}
                                  className={'uk-float-left'}
                                >
                                  <input
                                    name={'subject'}
                                    type="text"
                                    className={'md-input'}
                                    defaultValue={value.get('email')}
                                    style={{ borderWidth: 0 }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className={'vam nbb'}>
                                <div
                                  key={this.props.blacklistState.blacklist.indexOf(value) + 1}
                                  className={'uk-float-left'}
                                >
                                  <input
                                    name={'subject'}
                                    type="text"
                                    className={'md-input'}
                                    defaultValue={value.get('reason')}
                                    style={{ borderWidth: 0 }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className={'vam nbb'}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <button
                                    className={'uk-clearfix md-btn'}

                                    // onClick={onClick}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className={'uk-clearfix md-btn'}
                                    // onClick={onClick}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </Table>
                  </InfiniteScroll>
                  {/* </PageContent> */}
                  <div className="uk-pagination deletedTicketPagination"></div>
                </div>
              </div>
            </div>
          </div>
        </form>
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
  blacklistState: state.blacklistState,
});

export default connect(mapStateToProps, { updateSetting, fetchBlackList, addEmail })(BlackListModal);
