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
import styles from './styles.css';
@observer
class BlackListModal extends React.Component {
  @observable privacyPolicy = '';
  @observable pageStart = -1;
  @observable hasMore = true;
  @observable initialLoad = true;
  @observable initialState = [];
  @observable chance = new Chance();
  constructor(props) {
    super(props);
    this.state = {
      blacklist: [],
      recordsUpdate: [],
      blacklistMatchedLable: 'Enter the line',
      matchString: '',
      regex: '',
      reason: '',
    };
    makeObservable(this);
    this.onBlackListFetch = this.onBlackListFetch.bind(this);
    this.onBlackListSave = this.onBlackListSave.bind(this);
  }

  componentDidMount() {
    this.props.fetchBlackList({ limit: 5, skip: this.state.blacklist.length });
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

  updateRegex(e, value) {
    e.preventDefault();
    let list = [...this.state.blacklist];
    let listUpdate = [...this.state.recordsUpdate];

    let indexRecord = list.indexOf(value);
    list[indexRecord].regex = list[indexRecord].regex.replace(' ', '');
    if (list[indexRecord]._id && list[indexRecord].regex != '') {
      if (listUpdate.findIndex((record) => record._id == value._id) == -1) {
        listUpdate.push(list[indexRecord]);
      } else {
        const index = listUpdate.findIndex((record) => record._id === value._id);
        listUpdate[index] = value;
      }
    }

    this.setState({
      blacklist: list,
      recordsUpdate: listUpdate,
    });
  }

  onBlackListSave = (data) => {
    this.setState({
      blacklist: data.blacklist,
    });
  };

  onBlackListFetch = (data) => {
    console.log('onBlackListFetch');
    console.log(data);
    this.hasMore = data.blacklist.length >= 5;
    console.log('hasMore');
    console.log(data.blacklist.length >= 5);
    this.setState({
      blacklist: data.blacklist,
    });
  };

  async addRegex(e) {
    e.preventDefault();
    let list = [...this.state.blacklist];
    let key = this.chance.string({
      length: 8,
      pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890',
      alpha: true,
      numeric: true,
      casing: 'lower',
    });
    let value = {};
    value.regex = this.state.regex.replace(' ', '');
    value.reason = this.state.reason;
    value.key = key;

    if (value.regex != '') {
      await axios.post('/api/v2/blacklist/add', value).then((res) => {
        const record = res.data.record;
        list.push(record);
        this.setState({
          blacklist: list,
        });
        return true;
      });
    }
  }

  async removeRegex(value) {
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

    this.setState({
      blacklist: list,
      recordsUpdate: listUpdate,
    });

    if (value && value._id) {
      await axios.delete(`/api/v2/blacklist/remove/${value._id}`).then((res) => {
        return res.data;
      });
    }
  }

  handleChange = (event, key, property) => {
    const newItems = [...this.state.blacklist];
    const index = newItems.findIndex((record) => record.key === key);
    newItems[index][property] = event.target.value;
    this.setState({ blacklist: newItems });
  };

  inputChange = (event) => {
    event.preventDefault();

    const stateString = event.target.value;
    if (event.target.id == 'matchString') this.setState({ matchString: stateString });
    else if (event.target.id == 'regex') this.setState({ regex: stateString.replace(' ', '') });
    else if (event.target.id == 'reason') this.setState({ reason: stateString });
  };

  checkBlacklistMatched(e) {
    e.preventDefault();
    const matchString = this.state.matchString;
    if (matchString == '') {
      if (this.state.blacklistMatchedLable !== 'Enter the line') {
        this.setState({
          blacklistMatchedLable: 'Enter the line',
        });
      }
    } else {
      try {
        // Merge all regex fields into one RegExp variable
        const regexStr = this.state.blacklist
          .filter((record) => record.regex.replace(' ', '') != '')
          .map((record) => record.regex)
          .join('|');
        const mergedRegex = new RegExp(regexStr, 'g');
        if (String(mergedRegex) !== '/(?:)/g') {
          const resultCheck = mergedRegex.test(matchString);
          this.onCheckBlacklistMatched(resultCheck);
        }
        return false;
      } catch (err) {
        console.error(err);
        return false;
      }
    }
  }

  showTickCross(id) {
    const deleteIcon = document.getElementById(`delete-${id}`);
    const tickIcon = document.getElementById(`tick-${id}`);
    const crossIcon = document.getElementById(`cross-${id}`);

    if (deleteIcon && tickIcon && crossIcon) {
      deleteIcon.style.display = 'none';
      tickIcon.style.display = 'inline-block';
      crossIcon.style.display = 'inline-block';
    }
  }

  hideTickCross(id) {
    console.log('hideTickCross');
    console.log(id);
    const deleteIcon = document.getElementById(`delete-${id}`);
    const tickIcon = document.getElementById(`tick-${id}`);
    const crossIcon = document.getElementById(`cross-${id}`);

    if (deleteIcon && tickIcon && crossIcon) {
      deleteIcon.style.display = 'block';
      tickIcon.style.display = 'none';
      crossIcon.style.display = 'none';
    }
  }

  onCheckBlacklistMatched = (resultCheck) => {
    if (resultCheck) {
      this.setState({ blacklistMatchedLable: 'Status: Blacklist Matched' });
    } else {
      this.setState({ blacklistMatchedLable: 'Status: Blacklist Not Matched' });
    }
  };

  getRegexsWithPage(page) {
    this.hasMore = false;
    this.props.fetchBlackList({ limit: 5, skip: this.state.blacklist.length });
  }

  async onFormSubmit() {
    const data = {
      recordsUpdate: this.state.recordsUpdate,
    };

    if (data.recordsUpdate.length !== 0) {
      await axios.post('/api/v2/blacklist/update', data.recordsUpdate).then((res) => {
        console.log('update succsess');
        return res.data;
      });
    }

    this.props.hideModal();
  }

  render() {
    return (
      <BaseModal options={{ bgclose: false }} style={{ top: 150 }}>
        <form className="uk-form-stacked" onSubmit={(e) => this.onFormSubmit(e)} style={{ position: 'center' }}>
          <div className="setting-item-wrap">
            <div style={{ minHeight: '60px', height: 'auto' }}>
              <div>
                <div className="uk-position-relative">
                  <div>
                    <div>
                      <h2 className="uk-text-muted uk-text-center">Blacklist</h2>
                    </div>
                  </div>
                  <div className="uk-margin-medium-bottom">
                    <div className="uk-right">
                      <div
                        className="md-switch-wrapper md-switch md-green uk-float-right uk-clearfix"
                        style={{ margin: 0, position: 'absolute', right: -5, zIndex: 99 }}
                      >
                        <button
                          className="uk-float-right md-btn md-btn-small  md-btn-wave  undefined waves-effect waves-button"
                          type="button"
                          style={{ maxHeight: 27 }}
                          onClick={(e) => this.checkBlacklistMatched(e)}
                        >
                          <div className="uk-float-left uk-width-1-1 uk-text-center">Check</div>
                        </button>
                      </div>
                    </div>
                    <div className="md-input-wrapper md-input-filled">
                      <label style={{ top: -6, fontSize: 12 }}>{this.state.blacklistMatchedLable}</label>
                      <input
                        type="text"
                        id="matchString"
                        className="md-input md-input-width-medium"
                        onChange={(event) => this.inputChange(event)}
                        value={this.state.matchString}
                        placeholder="example@email.com"
                        style={{ width: '88%' }}
                      />
                      <span className="md-input-bar"></span>
                    </div>
                  </div>
                  <div className="uk-margin-medium-bottom">
                    <div className="uk-right">
                      <div
                        className="md-switch-wrapper md-switch md-green uk-float-right uk-clearfix"
                        style={{ margin: 0, position: 'absolute', right: -5, zIndex: 99 }}
                      >
                        <button
                          className="uk-float-right md-btn md-btn-small  md-btn-wave  undefined waves-effect waves-button"
                          type="button"
                          style={{ maxHeight: 27 }}
                          onClick={(e) => this.addRegex(e)}
                        >
                          <div className="uk-float-left uk-width-1-1 uk-text-center">Add</div>
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex' }}>
                      <div className="md-input-wrapper md-input-filled" style={{ flex: 1, width: '60%' }}>
                        <label style={{ top: -6, fontSize: 12 }}>Regex</label>
                        <input
                          type="text"
                          className="md-input md-input-width-medium"
                          style={{ width: '60%' }}
                          id="regex"
                          onChange={(event) => this.inputChange(event)}
                          value={this.state.regex}
                        />
                        <span className="md-input-bar" style={{ width: '60%' }}></span>
                      </div>
                      <div
                        className="md-input-wrapper md-input-filled"
                        style={{ flex: 1, marginTop: 0, marginLeft: -100 }}
                      >
                        <label style={{ top: -6, fontSize: 12 }}>Reason</label>
                        <input
                          type="text"
                          id="reason"
                          className="md-input md-input-width-medium"
                          style={{ width: '80%' }}
                          onChange={(event) => this.inputChange(event)}
                          value={this.state.reason}
                        />
                        <span className="md-input-bar"></span>
                      </div>
                    </div>
                  </div>
                  <PageContent id={'blacklist-page-content'} style={{ all: 'unset' }} padding={0}>
                    <InfiniteScroll
                      pageStart={this.pageStart}
                      loadMore={this.getRegexsWithPage}
                      hasMore={this.hasMore}
                      initialLoad={this.initialLoad}
                      threshold={5}
                      style={{ all: 'unset' }}
                      loader={
                        <div className={'uk-width-1-1 uk-text-center'} key={0}>
                          <i className={'uk-icon-refresh uk-icon-spin'} />
                        </div>
                      }
                      useWindow={false}
                      getScrollParent={() => document.getElementById('blacklist-page-content')}
                    >
                      <div>
                        <Table
                          style={{ margin: 0 }}
                          extraClass={'pDataTable'}
                          stickyHeader={true}
                          striped={true}
                          headers={[
                            <TableHeader key={1} width={'30%'} text={'Regex'} />,
                            <TableHeader key={2} width={'60%'} text={'Reason'} />,
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
                                          this.updateRegex(e, value);
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
                                        style={{ borderWidth: 0, width: '180%' }}
                                        onChange={(event) => this.handleChange(event, value.key, event.target.id)}
                                        onBlur={(e) => {
                                          this.updateRegex(e, value);
                                        }}
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell className={'vam nbb'}>
                                    <div style={{ position: 'relative' }}>
                                      <span
                                        className="material-icons"
                                        style={{ top: 15, left: 'auto', color: '#c8d6e6', fontSize: 20 }}
                                        onClick={() => {
                                          this.showTickCross(value._id);
                                        }}
                                        id={`delete-${value._id}`}
                                      >
                                        delete
                                      </span>
                                      <span
                                        className="material-icons"
                                        style={{
                                          top: 15,
                                          left: 'auto',
                                          color: '#c8d6e6',
                                          fontSize: 20,
                                          display: 'none',
                                          marginLeft: -13,
                                        }}
                                        onClick={() => {
                                          this.removeRegex(value);
                                        }}
                                        id={`tick-${value._id}`}
                                      >
                                        check
                                      </span>
                                      <span
                                        className="material-icons"
                                        style={{
                                          top: 15,
                                          left: 'auto',
                                          color: '#c8d6e6',
                                          fontSize: 20,
                                          display: 'none',
                                          paddingLeft: 5,
                                        }}
                                        onClick={() => {
                                          this.hideTickCross(value._id);
                                        }}
                                        id={`cross-${value._id}`}
                                      >
                                        close
                                      </span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </Table>
                      </div>
                    </InfiniteScroll>
                  </PageContent>
                  <div className="uk-modal-footer uk-text-right">
                    <Button text={'Close'} extraClass={'uk-modal-close'} flat={true} waves={true} />
                    <Button
                      text={'Apply'}
                      type={'button'}
                      flat={true}
                      waves={true}
                      style={'success'}
                      onClick={() => {
                        this.onFormSubmit();
                      }}
                    />
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
