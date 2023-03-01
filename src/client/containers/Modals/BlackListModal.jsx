import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import { connect } from 'react-redux';
import Button from 'components/Button';
import BaseModal from 'containers/Modals/BaseModal';
import { updateSetting } from 'actions/settings';
import Log from '../../logger';
import axios from 'axios';

@observer
class BlackListModal extends React.Component {
  @observable privacyPolicy = '';
  @observable blacklist = [];
  constructor(props) {
    super(props);

    makeObservable(this);
  }

  componentDidUpdate(prevProps) {
    // helpers.UI.reRenderInputs()
    if (prevProps.settings !== this.props.settings) {
      if (this.blacklist !== this.getSetting('blacklist:array')) this.blackList = this.getSetting('blacklist:array');
    }
  }

  onFormSubmit() {
    console.log('onFormSubmit');
    this.props.updateSetting({
      name: 'blacklist:array',
      value: this.blacklist,
      stateName: 'blacklist',
    });
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
});

export default connect(mapStateToProps, { updateSetting, showModal, hideModal })(BlackListModal);
