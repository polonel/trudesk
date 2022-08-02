import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import SessionContext, { getSession } from './SessionContext'
import Routes from './Routes'
import Layout from 'containers/Layout'

import 'lib/vendor/normalize/normalize.min.css'
import 'lib/vendor/chosen/chosen.css'
import 'lib/vendor/metricsgraphics/metricsgraphics.css'
import 'lib/vendor/uikit/css/font-awesome.min.css'
import 'lib/vendor/uikit/css/uikit.css'
import 'lib/vendor/uikit/css/uikit_custom.css'
import 'lib/plugins/snackbar.css'
import 'lib/vendor/c3/c3.css'
import 'lib/vendor/multiselect/css/multi-select.css'
import 'lib/vendor/formvalidator/theme-default.css'
import 'lib/vendor/easymde/dist/easymde.min.css'
// import 'lib/vendor/grapesjs/css/grapes.min.css'
import 'sass/app.sass'

const App = ({ store }) => {
  const [session, setSession] = useState({})

  return (
    <Provider store={store}>
      <SessionContext.Provider value={{ session, setSession }}>
        <Layout>
          <Routes />
        </Layout>
      </SessionContext.Provider>
    </Provider>
  )
}

App.propTypes = {
  store: PropTypes.object.isRequired
}

export default App
