/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    2/7/19 12:07 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import MailerSettings_Mailer from './mailer'
import Mailer_MailerCheck from './mailerCheck'
import MailerSettings_Templates from 'containers/Settings/Mailer/mailerSettingsTemplates'

class MailerSettingsContainer extends React.Component {
  render () {
    const { active } = this.props
    return (
      <div className={active ? 'active' : 'hide'}>
        <MailerSettings_Templates />
        <MailerSettings_Mailer />
        <Mailer_MailerCheck />
      </div>
    )
  }
}

MailerSettingsContainer.propTypes = {
  active: PropTypes.bool.isRequired
}

export default MailerSettingsContainer
