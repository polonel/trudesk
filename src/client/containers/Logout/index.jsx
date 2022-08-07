import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { clearSession } from 'app/SessionContext'

import axios from 'api/axios'
import SpinLoader from 'components/SpinLoader'

const api_logout = async () => {
  return new Promise((resolve, reject) => {
    ;(async () => {
      try {
        const res = await axios.get('/api/v2/logout')
        return resolve(res)
      } catch (e) {
        return reject(e)
      }
    })()
  })
}

const Logout = ({ setSession }) => {
  const navigate = useNavigate()

  useEffect(() => {
    setSession(clearSession())
    api_logout()
      .then(() => {
        setTimeout(() => {
          navigate('/')
        }, 1000)
      })
      .catch(() => {
        navigate('/')
      })
  }, [])

  return <SpinLoader active={true} fullScreen={true} />
}

Logout.propTypes = {
  setSession: PropTypes.func.isRequired
}

export default Logout
