import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import { connect } from 'react-redux';
import Button from 'components/Button';
import BaseModal from 'containers/Modals/BaseModal';
import { updateSetting } from 'actions/settings';
import { fetchBlackList, addRegex } from 'actions/blacklist';
import { fetchAccounts } from 'actions/accounts';
import InfiniteScroll from 'react-infinite-scroller';
import Log from '../../logger';
import axios from 'axios';
import Table from 'components/Table';
import TableHeader from 'components/Table/TableHeader';
import TableRow from 'components/Table/TableRow';
import PageContent from 'components/PageContent';
import TableCell from 'components/Table/TableCell';
import { hideModal } from 'actions/common';
import Chance from 'chance';
import Input from 'components/Input';
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
      recordsUpdate: [],
    };
    makeObservable(this);
    this.onBlackListFetch = this.onBlackListFetch.bind(this);
    this.onBlackListSave = this.onBlackListSave.bind(this);
  }

  componentDidMount() {
    this.props.fetchBlackList({ limit: 10, skip: this.blacklist.length }).then(({ response }) => {
      this.hasMore = response.count >= 5;
    });
    this.props.socket.on('$trudesk:client:blacklist:fetch', this.onBlackListFetch);
    this.props.socket.on('$trudesk:client:blacklist:save', this.onBlackListSave);
    this.initialLoad = false;
  }

  componentDidUpdate(prevProps) {
    // helpers.UI.reRenderInputs()
  }

  componentWillUnmount() {
    this.props.socket.off('$trudesk:client:blacklist:fetch', this.onBlackListFetch);
    this.props.socket.off('$trudesk:client:blacklist:save', this.onBlackListSave);
  }

  addRegex(e, value) {
    e.preventDefault();
    let list = [...this.state.blacklist];
    let listUpdate = [...this.state.recordsUpdate];

    let indexRecord = list.indexOf(value);

    if (list[indexRecord]._id) {
      if (listUpdate.findIndex((record) => record._id == value._id) == -1) {
        listUpdate.push(list[indexRecord]);
      } else {
        const index = listUpdate.findIndex((record) => record._id === value._id);
        listUpdate[index] = value;
      }
    }

    let listAdd = [...this.state.recordsAdd];
    let listRemove = [...this.state.recordsRemove];

    list[indexRecord].regex = list[indexRecord].regex.replace(' ', '');
    list[indexRecord].flags = list[indexRecord].flags.replace(' ', '');
    if (list[indexRecord].regex != '') {
      if (listAdd.findIndex((record) => record.regex == value.regex) != -1) {
        const index = listAdd.findIndex((record) => record.regex == value.regex);
        if (!list[indexRecord]._id) listAdd[index] = list[indexRecord];
      } else {
        if (!list[indexRecord]._id) listAdd.push(list[indexRecord]);
      }
    }
    if (this.state.recordsRemove.find((record) => record.regex == value.regex) != -1) {
      listRemove = [
        ...listRemove.filter((record) => {
          return record.regex != value.regex;
        }),
      ];
    }
    this.setState({
      blacklist: list,
      recordsAdd: listAdd,
      recordsUpdate: listUpdate,
      recordsRemove: listRemove,
    });
  }

  onBlackListSave = (data) => {
    this.setState({
      blacklist: data.blacklist,
    });
  };

  onBlackListFetch = (data) => {
    this.setState({
      blacklist: data.blacklist,
    });
  };

  addLine() {
    let value = {
      regex: '',
      flags: '',
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

  removeRegex(value) {
    let list = [
      ...this.state.blacklist.filter((record) => {
        if (record._id && value._id) {
          return record._id != value._id;
        } else {
          return record.key != value.key;
        }
      }),
    ];
    let listUpdate = [
      ...this.state.recordsUpdate.filter((record) => {
        if (record._id && value._id) {
          return record._id !== value._id;
        } else {
          return record.key !== value.key;
        }
      }),
    ];
    let listAdd = [...this.state.recordsAdd];
    let listRemove = [...this.state.recordsRemove];
    if (this.state.recordsAdd.find((record) => record.key === value.key) != -1) {
      listAdd = [
        ...listAdd.filter((record) => {
          if (record._id && value._id) {
            return record._id !== value._id;
          } else {
            return record.key !== value.key;
          }
        }),
      ];
    }
    if (value._id) {
      listRemove.push(value._id);
    }

    this.setState({
      blacklist: list,
      recordsAdd: listAdd,
      recordsUpdate: listUpdate,
      recordsRemove: listRemove,
    });
  }

  handleChange = (event, key, property) => {
    const newItems = [...this.state.blacklist];
    const index = newItems.findIndex((record) => record.key === key);
    newItems[index][property] = event.target.value;
    this.setState({ blacklist: newItems });
  };

  getRegexsWithPage(page) {
    this.hasMore = false;
  }

  async onFormSubmit() {
    const data = {
      recordsUpdate: this.state.recordsUpdate,
      recordsAdd: this.state.recordsAdd,
      recordsRemove: this.state.recordsRemove,
    };

    if (data.recordsAdd.length !== 0) {
      await axios.post('/api/v2/blacklist/add', data.recordsAdd).then((res) => {
        return res.data;
      });
    }

    if (data.recordsUpdate.length !== 0) {
      await axios.post('/api/v2/blacklist/update', data.recordsUpdate).then((res) => {
        return res.data;
      });
    }

    if (data.recordsRemove.length !== 0) {
      await axios.post('/api/v2/blacklist/delete', data.recordsRemove).then((res) => {
        return res.data;
      });
    }
    this.props.hideModal();
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
                    loadMore={this.getRegexsWithPage}
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
                        <TableHeader key={1} width={'30%'} text={'Regex'} />,
                        <TableHeader key={2} width={'60%'} text={'Reason'} />,
                        <TableHeader key={2} width={'12%'} text={'Flags'} />,
                        <TableHeader key={2} width={'12%'} />,
                      ]}
                    >
                      {this.state.blacklist &&
                        this.state.blacklist.map((value) => {
                          return (
                            <TableRow key={this.state.blacklist.indexOf(value) + 1} clickable={true}>
                              <TableCell className={'vam nbb'}>
                                <div
                                  key={this.state.blacklist.indexOf(value) + 1}
                                  className={'uk-float-left'}
                                  style={{ marginLeft: -5 }}
                                >
                                  <input
                                    name={'subject'}
                                    type="text"
                                    id="regex"
                                    className={'md-input'}
                                    value={value.regex}
                                    style={{ borderWidth: 0 }}
                                    onChange={(event) => this.handleChange(event, value.key, event.target.id)}
                                    onBlur={(e) => {
                                      this.addRegex(e, value);
                                    }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className={'vam nbb'}>
                                <div
                                  key={this.state.blacklist.indexOf(value) + 1}
                                  className={'uk-float-left'}
                                  style={{ marginLeft: -5 }}
                                >
                                  <input
                                    name={'subject'}
                                    type="text"
                                    id="flags"
                                    className={'md-input'}
                                    value={value.flags}
                                    style={{ borderWidth: 0 }}
                                    onChange={(event) => this.handleChange(event, value.key, event.target.id)}
                                    onBlur={(e) => {
                                      this.addRegex(e, value);
                                    }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className={'vam nbb'}>
                                <div
                                  key={this.state.blacklist.indexOf(value) + 1}
                                  className={'uk-float-left'}
                                  style={{ marginLeft: -5 }}
                                >
                                  <input
                                    name={'subject'}
                                    type="text"
                                    id="reason"
                                    className={'md-input'}
                                    value={value.reason}
                                    style={{ borderWidth: 0 }}
                                    onChange={(event) => this.handleChange(event, value.key, event.target.id)}
                                    onBlur={(e) => {
                                      this.addRegex(e, value);
                                    }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className={'vam nbb'}>
                                <span
                                  className="material-icons"
                                  style={{ top: 15, left: 'auto', color: '#c8d6e6', fontSize: 20 }}
                                  onClick={() => {
                                    this.removeRegex(value);
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

export default connect(mapStateToProps, { updateSetting, fetchBlackList, addRegex, hideModal })(BlackListModal);
