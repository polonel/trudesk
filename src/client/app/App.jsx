import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { history } from 'lib/lib-history'
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import SessionContext, { getSession, saveSession } from './SessionContext'
import RolesContext, { getRoles } from 'app/RolesContext'
import Routes from './Routes'
import Layout from 'containers/Layout'

import 'lib/vendor/normalize/normalize.min.css'
import 'lib/vendor/chosen/chosen.css'
import 'lib/vendor/metricsgraphics/metricsgraphics.css'
// import 'lib/vendor/uikit/css/font-awesome.min.css'
import '@fortawesome/fontawesome-free/js/all'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'lib/vendor/uikit/css/uikit.css'
import 'lib/vendor/uikit/css/uikit_custom.css'
import 'lib/plugins/snackbar.css'
import 'lib/vendor/c3/c3.css'
import 'lib/vendor/multiselect/css/multi-select.css'
import 'lib/vendor/formvalidator/theme-default.css'
import 'lib/vendor/easymde/dist/easymde.min.css'
// import 'lib/vendor/grapesjs/css/grapes.min.css'
import 'sass/app.sass'

import 'pace'
import axios from 'api/axios'
import SpinLoader from 'components/SpinLoader'
import useTrudeskReady from 'lib/useTrudeskReady'
import helpers from 'lib/helpers'
import DotLoader from 'components/DotLoader'

const App = ({ store }) => {
  const [session, setSession] = useState(getSession())
  const [pending, setPending] = useState(true)
  const [error, setError] = useState(null)
  // const [roles, setRoles] = useState(getRoles())
  const [ready, setReady] = useState(false)

  useTrudeskReady(() => {
    setReady(true)
  })

  useEffect(() => {
    const theSession = async () => {
      setPending(true)
      try {
        const data = await axios.post('/api/v2/token').then(res => res.data)
        if (data.token) setSession(saveSession(data))

        setPending(false)
      } catch (e) {
        if (e.response?.status === 401) {
          setPending(false)
        } else {
          setError(e)
          setPending(false)
        }
      }
    }
    helpers.init()
    theSession()
  }, [])

  if (pending) {
    return <SpinLoader active={true} fullScreen={true} />
  }

  if (error) {
    return <div>{error.message}</div>
  }

  return (
    <Provider store={store}>
      <DotLoader active={!ready} animate={true} />
      <SessionContext.Provider value={{ session, setSession }}>
        {/*<RolesContext.Provider value={{ roles, setRoles }}>*/}
        <HistoryRouter history={history}>
          <Layout>
            <Routes />
          </Layout>
        </HistoryRouter>
        {/*</RolesContext.Provider>*/}
      </SessionContext.Provider>
    </Provider>
  )
}

App.propTypes = {
  store: PropTypes.object.isRequired
}

export default App
