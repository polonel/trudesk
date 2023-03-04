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
import { convertNodeToElement } from 'react-html-parser';
import Chance from 'chance';
@observer
class BlackListModal extends React.Component {
  @observable privacyPolicy = '';
  @observable pageStart = -1;
  @observable hasMore = true;
  @observable initialLoad = true;
  @observable blacklist = [];
  @observable pageStart = -1;
  @observable initialState = [];
  @observable chance = new Chance();
  constructor(props) {
    super(props);
    this.state = {
      blacklist: [],
      recordsRemove: [],
      recordsAdd: [],
    };
    makeObservable(this);
    this.onBlackListFetch = this.onBlackListFetch.bind(this);
  }

  componentDidMount() {
    this.props.fetchBlackList({ limit: 10, skip: this.blacklist.length }).then(({ response }) => {
      this.hasMore = response.count >= 5;
      //this.blacklist = this.props.blacklistState.blacklist.map((email) => {
      //  return { email: email.get('email'), reason: email.get('reason') };
      // });
    });
    this.props.socket.on('$trudesk:client:blacklist:fetch', this.onBlackListFetch);
    this.initialLoad = false;
  }

  componentDidUpdate(prevProps) {
    // helpers.UI.reRenderInputs()
  }

  componentWillUnmount() {
    this.props.socket.off('$trudesk:client:blacklist:fetch', this.onBlackListFetch);
  }

  addEmail(e, value) {
    console.log('value');
    console.log(value);
    e.preventDefault();
    let list = [...this.state.blacklist];
    let email;
    let reason;
    let indexRecord = list.indexOf(value);

    if (e.target.id == 'email') {
      email = e.target.defaultValue;
      if (email !== e.target.value) {
        email = e.target.value;
        value.email = email;
        list[indexRecord] = list.push(value);
      }
    }

    if (e.target.id == 'reason') {
      reason = e.target.defaultValue;
      if (reason !== e.target.value) {
        reason = e.target.value;
        value.reason = reason;
        list[indexRecord] = list.push(value);
      }
    }

    let listAdd = [...this.state.recordsAdd];
    let listRemove = [...this.state.recordsRemove];

    listAdd.push(value);
    if (this.state.recordsRemove.find((record) => record.email === value.email) != -1) {
      listRemove = [
        ...listRemove.filter((record) => {
          return record.email !== value.email;
        }),
      ];
    }
    this.setState({
      blacklist: list,
      recordsAdd: listAdd,
      recordsRemove: listRemove,
    });
  }

  onBlackListFetch = (data) => {
    this.setState({
      blacklist: data.blacklist,
    });
  };

  addLine() {
    let value = {
      email: '',
      reason: '',
      key: '',
    };
    let list = [...this.state.blacklist];
    let key = this.chance.string({
      length: 8,
      pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890',
      alpha: true,
      numeric: true,
      casing: 'lower',
    });
    value.key = key;
    list.push(value);
    this.setState({
      blacklist: list,
    });
  }

  removeEmail(value) {
    let list = [
      ...this.state.blacklist.filter((record) => {
        if (record._id) return record._id !== value._id;
        else return record.key !== value.key;
      }),
    ];
    let listAdd = [...this.state.recordsAdd];
    let listRemove = [...this.state.recordsRemove];
    if (this.state.recordsAdd.find((record) => record.key === value.key) != -1) {
      listAdd = [
        ...listAdd.filter((record) => {
          return record.key !== value.key;
        }),
      ];
    }
    listRemove.push(value);
    this.setState({
      blacklist: list,
      recordsAdd: listAdd,
      recordsRemove: listRemove,
    });
  }

  getEmailsWithPage(page) {
    this.hasMore = false;
  }

  onFormSubmit() {
    const data = {
      blacklist: this.state.blacklist,
      recordsAdd: this.state.recordsAdd,
      recordsRemove: this.state.recordsRemove,
    };
    axios.put('/api/v2/blacklist/save', payload).then((res) => {
      return res.data;
    });
    const payload = {
      email: 'email@email.com',
      reason: 'Причина блокировки',
    };
  }

  render() {
    return (
      <BaseModal options={{}}>
        <form className="uk-form-stacked" onSubmit={(e) => this.onFormSubmit(e)} style={{ position: 'center' }}>
          <div className="setting-item-wrap">
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
                    // loader={
                    //   <div className={'uk-width-1-1 uk-text-center'} key={0}>
                    //     <i className={'uk-icon-refresh uk-icon-spin'} />
                    //   </div>
                    // }
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
                      {this.state.blacklist &&
                        this.state.blacklist.map((value) => {
                          return (
                            <TableRow key={this.state.blacklist.indexOf(value) + 1} clickable={true}>
                              <TableCell className={'vam nbb'}>
                                <div key={this.state.blacklist.indexOf(value) + 1} className={'uk-float-left'}>
                                  <input
                                    name={'subject'}
                                    type="text"
                                    id="email"
                                    className={'md-input'}
                                    defaultValue={value.email}
                                    style={{ borderWidth: 0 }}
                                    onBlur={(e) => {
                                      this.addEmail(e, value);
                                    }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className={'vam nbb'}>
                                <div key={this.state.blacklist.indexOf(value) + 1} className={'uk-float-left'}>
                                  <input
                                    name={'subject'}
                                    type="text"
                                    id="reason"
                                    className={'md-input'}
                                    defaultValue={value.reason}
                                    style={{ borderWidth: 0 }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className={'vam nbb'}>
                                <span
                                  className="material-icons"
                                  style={{ top: 15, left: 'auto', color: '#c8d6e6', fontSize: 20 }}
                                  onClick={() => {
                                    this.removeEmail(value);
                                  }}
                                >
                                  delete
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </Table>
                  </InfiniteScroll>
                  {/* </PageContent> */}
                  <div className="uk-pagination deletedTicketPagination" style={{ paddingTop: 10, marginBottom: -10 }}>
                    <div
                      class="md-btn md-btn-small"
                      onClick={() => {
                        this.addLine();
                      }}
                    >
                      Add
                    </div>
                    <div
                      class="md-btn md-btn-small"
                      onClick={() => {
                        this.onFormSubmit();
                      }}
                    >
                      Save
                    </div>
                  </div>
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
  socket: state.shared.socket,
  settings: state.settings.settings,
  blacklistState: state.blacklistState,
});

export default connect(mapStateToProps, { updateSetting, fetchBlackList, addEmail })(BlackListModal);
