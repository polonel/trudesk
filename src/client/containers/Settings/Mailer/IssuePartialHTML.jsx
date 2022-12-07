/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/24/19 5:32 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'

import helpers from 'lib/helpers'
import axios from 'axios'
import Log from '../../../logger'

@observer
class IssuePartialHTML extends React.Component {
  @observable templateId = ''

  constructor(props) {
    super(props)
    makeObservable(this)

    this.templateId = this.props.templateId
  }

  componentDidMount() {

  }

  componentDidUpdate(prevProps) {
    if (prevProps.templateId !== this.props.templateId) this.templateId = this.props.templateId
  }

  componentWillUnmount() {

  }

  onAttachmentInputChange(e) {
    const templateFile = e.target.files[0]
    const textType = /text.*/;
    let fullHTML = ''
    if (templateFile.type.match(textType)) {
      const reader = new FileReader();

      reader.onload = function (e) {
        fullHTML = reader.result;
      }

      reader.readAsText(templateFile);

      axios
        .put(`/api/v1/settings/mailer/template/${e.target.id.value}/fullHTML`, {
          fullHTML: fullHTML
        })
        .then(res => {
          if (res.data && res.data.success) helpers.UI.showSnackbar('Template fullHTML saved successfully')
        })
        .catch(error => {
          const errorText = error.response ? error.response.error : error
          helpers.UI.showSnackbar(`Error: ${errorText}`, true)
          Log.error(errorText, error)
        })

    } else {
      helpers.UI.showSnackbar(`Error: неверный формат файла`, true)
    }
  }

  removeAttachment(e, attachmentId) {

  }

  render() {
    return (
      <div className='initial-issue uk-clearfix'>
       <Fragment>
            <div
              className={'edit-issue'}
            >
              <i className='material-icons'>&#xE254;</i>
            </div>
            <form className='form nomargin' encType='multipart/form-data'>
              <div className='add-attachment'>
                <i className='material-icons'>&#xE226;</i>
              </div>

              <input
                className='hide'
                type='file'
                onChange={e => this.onAttachmentInputChange(e)}
              />
            </form>
          </Fragment>
      </div>
    )
  }
}

IssuePartialHTML.propTypes = {
  templateId: PropTypes.string.isRequired,
}

export default IssuePartialHTML
