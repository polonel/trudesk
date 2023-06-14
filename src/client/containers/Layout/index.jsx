import React, { Fragment, Suspense } from 'react'
import PropTypes from 'prop-types'
import SessionContext from '../../app/SessionContext'
import TopbarContainer from 'containers/Topbar/TopbarContainer'
import SpinLoader from 'components/SpinLoader'
import Sidebar from 'components/Nav/Sidebar'
import ThemeWrapper from 'containers/Layout/ThemeWrapper'
import { SingletonHooksContainer } from 'react-singleton-hook'
import SocketGlobal from 'containers/Global/SocketGlobal'
import BackupRestoreOverlay from 'containers/Global/BackupRestoreOverlay'
import ChatDock from 'containers/Global/ChatDock'

const Layout = ({ children }) => {
  return (
    <Fragment>
      <SessionContext.Consumer>
        {({ session: { user } }) => {
          if (!user) {
            return (
              <ThemeWrapper>
                <Suspense fallback={<SpinLoader active={true} fullScreen={true} />}>{children}</Suspense>
              </ThemeWrapper>
            )
          } else if (user) {
            return (
              <ThemeWrapper>
                <>
                  <SingletonHooksContainer />
                  <SocketGlobal />
                  {/*<HotKeysGlobal />*/}

                  <ChatDock />
                  <BackupRestoreOverlay />
                </>

                <TopbarContainer />
                <Sidebar sessionUser={user} />

                <div id={'page-content'} style={{ marginLeft: 57, position: 'relative' }}>
                  <Suspense fallback={<div />}>{children}</Suspense>
                </div>
              </ThemeWrapper>
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
