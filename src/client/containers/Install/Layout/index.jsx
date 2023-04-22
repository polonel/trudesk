import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

const Layout = ({ children }) => {
  return <Fragment>{children}</Fragment>
}

Layout.propTypes = {
  children: PropTypes.any
}

export default Layout
