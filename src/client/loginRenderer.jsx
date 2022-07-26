import ReactDOM from 'react-dom'
import React from 'react'

import LoginContainer from 'containers/Login'
import { Provider } from 'react-redux'

export default function init() {
  if (document.getElementById('login-container')) {
    const aur = document.getElementById('login-container').getAttribute('data-aur')
    const me = document.getElementById('login-container').getAttribute('data-me')
    ReactDOM.render(<LoginContainer aur={aur} me={me} />, document.getElementById('login-container'))
  }
}

init()
