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
class PrivacyPolicyModal extends React.Component {
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
      <BaseModal large={true} options={{}}>
        <div className={'uk-overflow-container'}>
          <ReactMarkdown remarkPlugins={[gfm]} rehypePlugins={[rehypeRaw]}>
            {this.privacyPolicy.toString().replace(/\\n/gi, '\n')}
          </ReactMarkdown>
        </div>
      </BaseModal>
    );
  }
}

PrivacyPolicyModal.propTypes = {};

export default PrivacyPolicyModal;
