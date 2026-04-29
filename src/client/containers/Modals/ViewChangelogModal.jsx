import React from 'react'
import PropTypes from 'prop-types'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

import BaseModal from 'containers/Modals/BaseModal'

function ViewChangelogModal ({ content, link }) {
  return (
    <BaseModal large={true} options={{}}>
      <div className={'uk-overflow-container'}>
        <ReactMarkdown remarkPlugins={[gfm]} rehypePlugins={[rehypeRaw]}>
          {content?.toString().replace(/\\n/gi, '\n')}
        </ReactMarkdown>

        <div style={{ marginTop: 25 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'right' }}>
            <a href={link} className={'md-btn md-btn-accent'} target={'_blank'} rel={'noreferrer noopener'}>
              View on Github
            </a>
            <a href='#' className={'md-btn md-btn-flat md-btn-flat-primary uk-modal-close'}>
              Close
            </a>
          </div>
        </div>
      </div>
    </BaseModal>
  )
}

ViewChangelogModal.propTypes = {
  content: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired
}

export default ViewChangelogModal
