import React, { lazy, Fragment } from 'react'
import { Navigate, Route, Routes, Link, useParams, useLocation } from 'react-router-dom'
import SessionContext from './SessionContext'
import Login from 'containers/Login'
import ForgotPasswordContainer from 'containers/Login/forgotPassword'
import MFAVerify from 'containers/Login/mfaVerify'
import TestFlow from 'containers/ReactFlow/testflow'

const LogoutContainer = lazy(() => import(/* webpackChunkName: "auth" */ 'containers/Logout'))
const ProfileContainer = lazy(() => import(/* webpackChunkName:"profile" */ 'containers/Profile'))
const DashboardContainer = lazy(() => import(/* webpackChunkName: "dashboard" */ 'containers/Dashboard'))
const TC_Lazy = lazy(() => import(/* webpackChunkName: "tickets" */ 'containers/Tickets/TicketsContainer'))
const SingleTicketContainer = lazy(() =>
  import(/*webpackChunkName: "tickets" */ 'containers/Tickets/SingleTicketContainer')
)
const MessagesContainer = lazy(() => import(/* webpackChunkName:  "conversations" */ 'containers/Messages'))
const AccountsContainer = lazy(() => import(/* webpackChunkName: "accounts" */ 'containers/Accounts'))
const GroupsContainer = lazy(() => import(/* webpackChunkName: "groups" */ 'containers/Groups'))
const TeamsContainer = lazy(() => import(/* webpackChunkName:  "teams" */ 'containers/Teams'))
const DepartmentsContainer = lazy(() => import(/* webpackChunkName: "departments" */ 'containers/Departments'))
const NoticesContainer = lazy(() => import(/* webpackChunkName: "notices" */ 'containers/Notice/NoticeContainer'))
const SettingsLazy = lazy(() => import(/* webpackChunkName: "settings" */ 'containers/Settings/SettingsContainer'))
const SettingsV2Lazy = lazy(() => import(/* webpackChunkName: "settings" */ 'containers/SettingsV2/SettingsContainer'))
const AboutContainer = lazy(() => import(/* webpackChunkName: "about" */ 'containers/About'))

const SettingsTimeAndDateLazy = lazy(() =>
  import(/* webpackChunkName: "settings" */ 'containers/SettingsV2/General/Settings-TimeAndDate')
)
const SettingsRebrandingLazy = lazy(() =>
  import(/* webpackChunkName: "settings" */ 'containers/SettingsV2/General/Settings-Rebranding')
)
const SettingsColorSchemesLazy = lazy(() =>
  import(/* webpackChunkName: "settings" */ 'containers/SettingsV2/General/Settings-ColorSchemes')
)
const SettingsMailerLazy = lazy(() =>
  import(/* webpackChunkName: "settings" */ 'containers/SettingsV2/Email/Settings-Mailer')
)
const SettingsIncomingMailLazy = lazy(() =>
  import(/* webpackChunkName: "settings" */ 'containers/SettingsV2/Email/Settings-IncomingMail')
)
const SettingsNotificationTemplatesLazy = lazy(() =>
  import(/* webpackChunkName: "settings" */ 'containers/SettingsV2/Email/Settings-NotificationTemplates')
)
const SettingsAgentsLazy = lazy(() =>
  import(/* webpackChunkName: "settings" */ 'containers/SettingsV2/Accounts/Settings-Agents')
)
const SettingsRolesAndPermissionsLazy = lazy(() =>
  import(/* webpackChunkName: "settings" */ 'containers/SettingsV2/Accounts/Settings-RolesAndPermissions')
)

const TC_WithParams = props => {
  const params = useParams()
  return <TC_Lazy page={params.page} {...props} />
}

const SingleTicket = props => {
  const params = useParams()

  return <SingleTicketContainer ticketUid={params.uid} {...props} />
}

const MessagesWithParams = props => {
  const params = useParams()

  return <MessagesContainer initialConversation={params.convo} {...props} />
}

const AccountsWithParams = props => {
  const params = useParams()

  return <AccountsContainer view={params.view} {...props} />
}

const GroupsWithParams = props => {
  const params = useParams()

  return <GroupsContainer {...props} />
}

const BaseRouter = ({ user, setSession }) => {
  // console.log('User: ', user)
  const location = useLocation()
  if (!user) {
    return (
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path={'logout'} element={<LogoutContainer setSession={setSession} />} exact />
        <Route path={'forgotpassword'} element={<ForgotPasswordContainer />} exact />
        <Route path={'mfa'} element={<MFAVerify setSession={setSession} />} exact />
        <Route path='*' element={<Navigate to={'/'} exact />} />
      </Routes>
    )
  } else {
    return (
      <Routes>
        <Route path={'/'} element={<Navigate to={'/dashboard'} exact />} />
        <Route path={'/mfa'} element={<Navigate to={'/dashboard'} exact />} />
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

        {/* Conversations */}
        <Route path={'messages'} element={<MessagesContainer key={0} sessionUser={user} />} exact />
        <Route path={'messages/:convo'} element={<MessagesWithParams key={location.key} sessionUser={user} />} exact />

        {/* Accounts*/}
        <Route path={'accounts'} element={<AccountsContainer key={0} sessionUser={user} />} exact />
        <Route path={'accounts/:view'} element={<AccountsWithParams key={location.key} sessionUser={user} />} exact />

        {/* Groups */}
        <Route path={'groups'} element={<GroupsContainer key={0} sessionUser={user} />} exact />

        {/* Teams */}
        <Route path={'teams'} element={<TeamsContainer key={location.key} sessionUser={user} />} exact />

        {/* Departments */}
        <Route path={'departments'} element={<DepartmentsContainer key={location.key} sessionUser={user} />} exact />

        {/* Notices*/}
        <Route path={'notices'} element={<NoticesContainer key={location.key} sessionUser={user} />} exact />

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

        <Route path={'v2settings'} element={<SettingsV2Lazy />} />
        <Route path={'v2settings/timeanddate'} element={<SettingsTimeAndDateLazy />} />
        <Route path={'v2settings/rebranding'} element={<SettingsRebrandingLazy />} />
        <Route path={'v2settings/colorschemes'} element={<SettingsColorSchemesLazy />} />
        <Route path={'v2settings/mailer'} element={<SettingsMailerLazy />} />
        <Route path={'v2settings/incomingmail'} element={<SettingsIncomingMailLazy />} />
        <Route path={'v2settings/mailnotificationtemplates'} element={<SettingsNotificationTemplatesLazy />} />

        <Route path={'v2settings/agents'} element={<SettingsAgentsLazy />} />
        <Route path={'v2settings/roles'} element={<SettingsRolesAndPermissionsLazy />} />

        <Route path={'about'} element={<AboutContainer />} />

        <Route path={'flow'} element={<TestFlow />} />

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
