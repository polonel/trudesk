import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import BaseModal from 'containers/Modals/BaseModal';

import Log from '../../logger';
import axios from 'axios';

@observer
class BlackListModal extends React.Component {
  @observable privacyPolicy = '';

  constructor(props) {
    super(props);

    makeObservable(this);
  }

  componentDidMount() {
    axios
      .get('/api/v1/privacypolicy')
      .then((res) => {
        this.privacyPolicy = res.data ? res.data.privacyPolicy : '';
      })
      .catch((err) => {
        Log.error(err);
      });
  }

  render() {
    return (
      <div className="setting-item-wrap uk-margin-medium-bottom">
        <div
          className="panel trupanel nopadding no-hover-shadow uk-overflow-hidden"
          style={{ minHeight: '60px', height: 'auto' }}
        >
          <div className="left">
            <h6 style={{ padding: '0 0 0 15px', margin: '15px 0 0 0', fontSize: '16px', lineHeight: '14px' }}>
              Restore Deleted Tickets
            </h6>
            <h5 style={{ padding: '0 0 10px 15px', margin: '2px 0 0 0', fontSize: '12px' }} className="uk-text-muted">
              Tickets marked as deleted are shown below.
            </h5>
          </div>
          <div
            className="right uk-width-1-3 uk-clearfix"
            style={{ position: 'relative', marginRight: '15px', marginTop: '5px' }}
          ></div>
          <hr className="nomargin-top clear" />
          <div className="panel-body2" style={{ padding: '20px 15px 15px 15px' }}>
            <div className="uk-position-relative">
              <div className="zone mb-10" style={{ display: deletedTickets.length ? 'none' : 'block' }}>
                <div className="z-box uk-clearfix">
                  <h2 className="uk-text-muted uk-text-center">No Deleted Tickets</h2>
                </div>
              </div>

              <table className="uk-table mt-0 mb-5" style={{ display: deletedTickets.length ? 'block' : 'none' }}>
                <thead>
                  <tr>
                    <th>UID</th>
                    <th>Subject</th>
                    <th>Group</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {deletedTickets.map((ticket) => (
                    <tr key={ticket.uid}>
                      <td className="valign-middle" style={{ width: '10%', height: '60px' }}>
                        {ticket.uid}
                      </td>
                      <td className="valign-middle" style={{ width: '30%' }}>
                        {ticket.subject}
                      </td>
                      <td className="valign-middle" style={{ width: '30%' }}>
                        {ticket.group.name}
                      </td>
                      <td className="valign-middle" style={{ width: '30%' }}>
                        {ticket.date}
                      </td>
                      <td className="uk-text-right valign-middle">
                        <div className="md-btn-group">
                          <button
                            className="md-btn md-btn-small md-btn-wave"
                            onClick={() => restoreDeletedTicket(ticket)}
                          >
                            Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="uk-pagination deletedTicketPagination"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

BlackListModal.propTypes = {};

export default BlackListModal;
