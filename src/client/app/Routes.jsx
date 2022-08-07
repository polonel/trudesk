import React, { lazy, Fragment } from 'react'
import { Navigate, Route, Routes, Link, useParams } from 'react-router-dom'
import SessionContext from './SessionContext'
import Login from 'containers/Login'

const LogoutContainer = lazy(() => import(/* webpackChunkName: "auth" */ 'containers/Logout'))
const ProfileContainer = lazy(() => import(/* webpackChunkName:"profile" */ 'containers/Profile'))
const DashboardContainer = lazy(() => import(/* webpackChunkName: "dashboard" */ 'containers/Dashboard'))
const TC_Lazy = lazy(() => import(/* webpackChunkName: "tickets" */ 'containers/Tickets/TicketsContainer'))
const SingleTicketContainer = lazy(() =>
  import(/*webpackChunkName: "tickets" */ 'containers/Tickets/SingleTicketContainer')
)
const SettingsLazy = lazy(() => import(/* webpackChunkName: "settings" */ 'containers/Settings/SettingsContainer'))

const TC_WithParams = props => {
  const params = useParams()

  return <TC_Lazy page={params.page} {...props} />
}

const SingleTicket = props => {
  const params = useParams()

  return <SingleTicketContainer ticketUid={params.uid} {...props} />
}

const BaseRouter = ({ user, setSession }) => {
  // console.log('User: ', user)
  if (!user) {
    return (
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path={'logout'} element={<LogoutContainer setSession={setSession} />} exact />
        <Route path='*' element={<Navigate to={'/'} />} />
      </Routes>
    )
  } else {
    return (
      <Routes>
        <Route path={'/'} element={<Navigate to={'/tickets'} />} />
        <Route path={'logout'} element={<LogoutContainer setSession={setSession} />} exact />
        <Route path={'profile'} element={<ProfileContainer setSession={setSession} />} exact />
        <Route path={'dashboard'} element={<DashboardContainer />} exact />

        {/* TICKETS */}
        <Route path={'tickets'} element={<TC_Lazy key={0} sessionUser={user} />} exact />
        <Route path={'tickets/active'} element={<TC_Lazy key={1} view='active' sessionUser={user} />} exact />
        <Route path={'tickets/assigned'} element={<TC_Lazy key={2} view='assigned' sessionUser={user} />} exact />
        <Route path={'tickets/new'} element={<TC_Lazy key={3} view='new' sessionUser={user} />} exact />
        <Route path={'tickets/pending'} element={<TC_Lazy key={4} view='pending' sessionUser={user} />} exact />
        <Route path={'tickets/open'} element={<TC_Lazy key={5} view='open' sessionUser={user} />} exact />
        <Route path={'tickets/closed'} element={<TC_Lazy key={6} view='closed' sessionUser={user} />} exact />
        <Route
          path={'tickets/closed/page/:page'}
          element={<TC_WithParams key={6} view='closed' sessionUser={user} />}
          exact
        />
        <Route path={'tickets/:uid'} element={<SingleTicket sessionUser={user} />} exact />

        {/*Settings*/}
        <Route path={'settings'} element={<SettingsLazy />} />
        <Route path={'settings/general'} element={<SettingsLazy key={0} />} />
        <Route path={'settings/accounts'} element={<SettingsLazy key={1} />} />
        <Route path={'settings/appearance'} element={<SettingsLazy key={2} />} />
        <Route path={'settings/permissions'} element={<SettingsLazy key={3} />} />
        <Route path={'settings/tickets'} element={<SettingsLazy key={4} />} />
        <Route path={'settings/mailer'} element={<SettingsLazy key={5} />} />
        <Route path={'settings/elasticsearch'} element={<SettingsLazy key={6} />} />
        <Route path={'settings/backup'} element={<SettingsLazy key={7} />} />
        <Route path={'settings/server'} element={<SettingsLazy key={8} />} />
        <Route path={'settings/legal'} element={<SettingsLazy key={9} />} />

        <Route path={'*'} element={<NotFound />} />
      </Routes>
    )
  }
}

const NotFound = () => (
  <Fragment>
    <section
      style={{
        width: '100%',
        height: 'calc(100vh - 50px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h1 className={'uk-text-muted'} style={{ fontSize: 128, lineHeight: '128px' }}>
          404
        </h1>
        <div style={{ flex: '0 0 1 auto auto' }}>
          Page not found. Return <Link to={`/`}>Home</Link>
        </div>
      </div>
    </section>
  </Fragment>
)

function RoutesMain () {
  return (
    <SessionContext.Consumer>
      {({ session: { user }, setSession }) => <BaseRouter user={user} setSession={setSession} />}
    </SessionContext.Consumer>
  )
}

export default RoutesMain
