import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Main from '../containers/Main'

const BaseRouter = () => {
  return (
    <Routes>
      <Route path={'/install'} element={<Main />} />
    </Routes>
  )
}

export default BaseRouter
