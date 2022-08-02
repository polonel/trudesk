import React, { lazy, Fragment } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import SessionContext from './SessionContext'
import Login from 'containers/Login'

const BaseRouter = ({ user, session }) => {
  if (!user) {
    return (
      <Routes>
        <Route path='/' element={<Login />} />
      </Routes>
    )
  }
}

function RoutesMain () {
  return (
    <SessionContext.Consumer>
      {({ session: { user }, setSession }) => (
        <BrowserRouter>
          <BaseRouter />
        </BrowserRouter>
      )}
    </SessionContext.Consumer>
  )
}

export default RoutesMain
