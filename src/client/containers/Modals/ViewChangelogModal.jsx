import React from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

import BaseModal from 'containers/Modals/BaseModal'

import Log from '../../logger'
import axios from 'axios'

@observer
class ViewChangelogModal extends React.Component {
  @observable content = ''

  constructor (props) {
    super(props)

    makeObservable(this)
  }

  componentDidMount () {
    this.content = this.props.content
  }

  render () {
    return (
      <BaseModal large={true} options={{}}>
        <div className={'uk-overflow-container'}>
          <ReactMarkdown remarkPlugins={[gfm]} rehypePlugins={[rehypeRaw]}>
            {this.content?.toString().replace(/\\n/gi, '\n')}
          </ReactMarkdown>

          <div style={{ marginTop: 25 }}>
            <a href={this.props.link} style={{ fontSize: '1.25rem' }} target={'_blank'} rel={'noreferrer noopener'}>
              View on Github
            </a>
          </div>
        </div>
      </BaseModal>
    )
  }
}

ViewChangelogModal.propTypes = {
  content: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired
}

export default ViewChangelogModal
