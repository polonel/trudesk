import React, { Fragment, Suspense } from 'react'
import PropTypes from 'prop-types'
import SessionContext from '../../app/SessionContext'
import TopbarContainer from 'containers/Topbar/TopbarContainer'
import { store } from '../../app'
import SpinLoader from 'components/SpinLoader'

const Layout = ({ children }) => {
  return (
    <Fragment>
      <SessionContext.Consumer>
        {({ session: { user, refreshToken } }) => {
          if (!user) {
            // if (!refreshToken) socket.disconnect()
            return (
              <Suspense
                fallback={
                  <SpinLoader active={true} style={{ top: 'auto', left: 'auto', bottom: 'auto', right: 'auto' }} />
                }
              >
                {children}
              </Suspense>
            )
          }
        }}
      </SessionContext.Consumer>
    </Fragment>
  )
}

Layout.propTypes = {
  children: PropTypes.any.isRequired
}

export default Layout
