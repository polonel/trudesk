import { createRoot } from 'react-dom/client'
import React from 'react'

import LoginContainer from 'containers/Login'

export default function init() {
  if (document.getElementById('login-container')) {
    const aur = document.getElementById('login-container').getAttribute('data-aur')
    const me = document.getElementById('login-container').getAttribute('data-me')
    createRoot(document.getElementById('login-container')).render(<LoginContainer aur={aur} me={me} />)
  }
}

init()
