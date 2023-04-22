import React, { useState, forwardRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import Slide from 'containers/Install/Slides/Slide'
import helpers from 'containers/Install/install-helpers'
import axios from 'axios'

const MongoSlide = forwardRef(({ slidesEl }, ref) => {
  const [mHost, setMHost] = useState('localhost')
  const [mPort, setMPort] = useState('27017')
  const [mUsername, setMUsername] = useState('trudesk')
  const [mPassword, setMPassword] = useState('#TruDesk1$')
  const [mDatabase, setMDatabase] = useState('trudesk')

  useImperativeHandle(ref, () => ({
    getValues
  }))

  const getValues = () => {
    return {
      mHost,
      mPort,
      mUsername,
      mPassword,
      mDatabase
    }
  }

  const testMongoDBConnection = function (e) {
    if (helpers.isDoubleClicked(e.target)) return
    e.target.disabled = true
    e.target.classList.add('disabled')
    e.target.innerHTML = 'Trying to connect...'
    axios
      .post('/install/mongotest', {
        host: mHost,
        port: mPort,
        username: mUsername,
        password: mPassword,
        database: mDatabase
      })
      .then(response => {
        if (!response.data.success) {
          helpers.UI.showSnackbar("Couldn't connect; make sure connection is correct.", true)
          e.target.disabled = false
          e.target.classList.remove('disabled')
          e.target.innerHTML = 'Test Connection'
        } else {
          helpers.UI.showSnackbar('MongoDB Connection Successful!', false)
          e.target.innerHTML = 'Connected!'
          // Advance Slide
          if (slidesEl.current) {
            slidesEl.current?.advanceSlides()
          }
        }
      })
      .catch(err => {
        helpers.UI.showSnackbar("Couldn't connect; make sure connection is correct.", true)
        e.target.disabled = false
        e.target.classList.remove('disabled')
        e.target.innerHTML = 'Test Connection'
        console.error(err)
      })
  }

  return (
    <Slide>
      <h2 style={{ marginBottom: 25 }}>MongoDB Connection</h2>
      <p style={{ textAlign: 'left' }}>
        We&apos;ve got to store the data somewhere. We&apos;ve chosen MongoDB as our backend storage. Just enter your
        connection information below and lets get connected.
      </p>
      <form id='mongoConnection' className='uk-form-stacked uk-clearfix'>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='mongo-server'>Server</label>
          <input
            id='mongo-server'
            name='mongo-server'
            className='md-input'
            type='text'
            value={mHost}
            onChange={e => setMHost(e.target.value)}
          />
        </div>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='mongo-port'>Port</label>
          <input
            id='mongo-port'
            name='mongo-port'
            className='md-input'
            type='text'
            value={mPort}
            onChange={e => setMPort(e.target.value)}
          />
        </div>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='mongo-username'>Username</label>
          <input
            id='mongo-username'
            name='mongo-username'
            className='md-input'
            type='text'
            value={mUsername}
            onChange={e => setMUsername(e.target.value)}
          />
        </div>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='mongo-password'>Password</label>
          <input
            id='mongo-password'
            name='mongo-password'
            className='md-input'
            type='password'
            value={mPassword}
            onChange={e => setMPassword(e.target.value)}
          />
        </div>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='mongo-database'>Database</label>
          <input
            id='mongo-database'
            name='mongo-database'
            className='md-input'
            type='text'
            value={mDatabase}
            onChange={e => setMDatabase(e.target.value)}
          />
        </div>
        <button
          className='btn md-btn md-btn-wave md-btn-primary'
          type='button'
          id='test-mongo-connection'
          onClick={e => testMongoDBConnection(e)}
        >
          Test Connection!
        </button>
      </form>
      <a href='https://www.mongodb.com/' className='no-ajaxy' target='_blank' rel={'noreferrer'}>
        What is MongoDB?
      </a>
    </Slide>
  )
})

MongoSlide.propTypes = {
  slidesEl: PropTypes.any
}

MongoSlide.displayName = 'MongoSlide'

export default MongoSlide
