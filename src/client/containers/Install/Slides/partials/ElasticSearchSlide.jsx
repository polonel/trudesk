import React, { useState, forwardRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import Slide from 'containers/Install/Slides/Slide'
import helpers from 'containers/Install/install-helpers'
import axios from 'axios'

const ElasticSearchSlide = forwardRef(({ slidesEl }, ref) => {
  const [esEnabled, setEsEnabled] = useState(false)
  const [esHost, setEsHost] = useState('http://localhost')
  const [esPort, setEsPort] = useState('9200')

  useImperativeHandle(ref, () => ({
    getValues
  }))

  const getValues = () => {
    return {
      esEnabled,
      esHost,
      esPort
    }
  }

  const testElasticSearchConnection = function (e) {
    if (helpers.isDoubleClicked(e.target)) return
    e.target.disabled = true
    e.target.classList.add('disabled')
    e.target.innerHTML = 'Trying to connect...'

    axios
      .post('/install/elastictest', {
        host: esHost,
        port: esPort
      })
      .then(response => {
        if (!response.data.success) {
          helpers.UI.showSnackbar("Couldn't connect; make sure connection is correct.", true)
          e.target.disabled = false
          e.target.classList.remove('disabled')
          e.target.innerHTML = 'Test Connection'
        } else {
          helpers.UI.showSnackbar('ElasticSearch Connection Successful!', false)
          setEsEnabled(true)
          slidesEl.current?.advanceSlides()
        }
      })
      .catch(err => {
        helpers.UI.showSnackbar("Couldn't connect; make sure connection is correct.", true)
        e.target.disabled = false
        e.target.classList.remove('disabled')
        e.target.innerHTML = 'Test Connection'
        console.log(err)
      })
  }

  return (
    <Slide>
      <h2 style={{ marginBottom: 25 }}>ElasticSearch Connection</h2>
      <p style={{ textAlign: 'left' }}>
        It allows us to search. Its optional, but you should probably set up the connection.
      </p>
      <form id='elasticConnection' className='uk-form-stacked uk-clearfix'>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='elastic-host'>Server</label>
          <input
            id='elastic-host'
            name='elastic-host'
            className='md-input'
            type='text'
            value={esHost}
            onChange={e => setEsHost(e.target.value)}
          />
        </div>
        <div className='uk-margin-medium-bottom'>
          <label htmlFor='elastic-port'>Port</label>
          <input
            id='elastic-port'
            name='elastic-port'
            className='md-input'
            type='text'
            value={esPort}
            onChange={e => setEsPort(e.target.value)}
          />
        </div>
        <button
          className='btn md-btn md-btn-wave md-btn-primary'
          type='button'
          onClick={e => testElasticSearchConnection(e)}
        >
          Test Connection!
        </button>
      </form>

      <div className='uk-clearfix'>
        <a
          href='#'
          id='btn-skip-elastic'
          className='no-ajaxy uk-float-left'
          onClick={e => {
            e.preventDefault()
            setEsEnabled(false)
            slidesEl.current?.advanceSlides()
          }}
        >
          Skip ElasticSearch
        </a>
        <a href='https://www.elastic.co/products/elasticsearch' className='no-ajaxy' target='_blank' rel={'noreferrer'}>
          What is ElasticSearch?
        </a>
      </div>
    </Slide>
  )
})

ElasticSearchSlide.propTypes = {
  slidesEl: PropTypes.any
}

ElasticSearchSlide.displayName = 'ElasticSearchSlide'

export default ElasticSearchSlide
