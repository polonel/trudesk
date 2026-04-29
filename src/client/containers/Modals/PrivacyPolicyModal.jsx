import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

import BaseModal from 'containers/Modals/BaseModal'

import Log from '../../logger'
import axios from 'axios'

function PrivacyPolicyModal () {
  const [privacyPolicy, setPrivacyPolicy] = useState('')

  useEffect(() => {
    axios
      .get('/api/v1/privacypolicy')
      .then(res => {
        setPrivacyPolicy(res.data ? res.data.privacyPolicy : '')
      })
      .catch(err => {
        Log.error(err)
      })
  }, [])

  return (
    <BaseModal large={true} options={{}}>
      <div className={'uk-overflow-container'}>
        <ReactMarkdown remarkPlugins={[gfm]} rehypePlugins={[rehypeRaw]}>
          {privacyPolicy.toString().replace(/\\n/gi, '\n')}
        </ReactMarkdown>
      </div>
    </BaseModal>
  )
}

export default PrivacyPolicyModal
