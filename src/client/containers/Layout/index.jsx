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
                <Fragment>
                  <div className='sidebar nopadding ' style={{ overflowX: 'hidden' }} data-scroll-opacitymax='0.1'>
                    <div className='side-nav-container' style={{ minHeight: 'calc(100% - 53px)' }}>
                      <Sidebar sessionUser={user} />
                    </div>
                    {/*<SidebarExpandButton />*/}
                  </div>
                  <div className='sidebar-to-right' />
                </Fragment>
                <div id={'page-content'} style={{ marginLeft: 57 }}>
                  <Suspense fallback={<SpinLoader active={true} fullScreen={true} />}>{children}</Suspense>
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
