import React from 'react'
import ReactDOM from 'react-dom'
import { history } from 'lib/lib-history'
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom'

import Layout from 'containers/Install/Layout'
import Routes from './Routes'

import 'lib/vendor/normalize/normalize.min.css'
import 'lib/vendor/uikit/css/uikit.css'
import 'lib/vendor/uikit/css/uikit_custom.css'
import 'lib/plugins/snackbar.css'
import './install-styles.sass'
// import 'sass/app.sass'

// import axios from 'api/axios'
import helpers from './install-helpers'
// import * as $ from 'jquery'

const InstallApp = () => {
  return (
    <HistoryRouter history={history}>
      <Layout>
        <Routes />
      </Layout>
    </HistoryRouter>
  )
}

if (document.getElementById('trudesk-install')) {
  const app = <InstallApp />
  ReactDOM.render(app, document.getElementById('trudesk-install'))
}
