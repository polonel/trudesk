/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    7/7/19 1:19 PM
 *  Copyright (c) 2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import TitleContext from 'app/TitleContext'
import { fetchTheme } from 'actions/common'
import setTheme from '../../lib/theme'

class ThemeWrapper extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      assets: null,
      title: 'Trudesk &middot;'
    }
  }

  componentDidMount () {
    // this.props.fetchViewSettings()
    this.props.fetchTheme()
    this.loadTheme()
  }

  componentDidUpdate () {
    this.loadTheme()
  }

  loadTheme () {
    const theme = this.props.theme
    if (!theme) return
    const colorScheme = {
      headerBG: theme.headerBG,
      headerPrimary: theme.headerPrimary,
      primary: theme.primary,
      secondary: theme.secondary,
      tertiary: theme.tertiary,
      quaternary: theme.quaternary
    }

    setTheme(colorScheme)
  }

  render () {
    if (this.props.theme.loading) return null
    // const customFavicon = this.props.theme.customFavicon || false
    // const customFaviconUrl = customFavicon ? this.props.theme.customFaviconUrl : 'favicon.ico'
    const title = this.props.common.siteTitle ? `${this.props.common.siteTitle} ·` : 'Trudesk ·'

    return (
      <HelmetProvider>
        <TitleContext.Provider value={{ title }}>
          <Helmet>
            <title>{title}</title>
            {/*<link rel={'shortcut icon'} href={`https://files.trudesk.io/${customFaviconUrl}`} />*/}
          </Helmet>
          {this.props.children}
        </TitleContext.Provider>
      </HelmetProvider>
    )
  }
}

ThemeWrapper.propTypes = {
  common: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  children: PropTypes.any,
  fetchTheme: PropTypes.func.isRequired
  // fetchViewSettings: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  theme: state.theme,
  common: state.common
})

export default connect(mapStateToProps, { fetchTheme })(ThemeWrapper)
