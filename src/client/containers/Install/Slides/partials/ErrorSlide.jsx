import React from 'react'
import PropTypes from 'prop-types'
import Slide from 'containers/Install/Slides/Slide'

const ErrorSlide = ({ errorText }) => {
  return (
    <Slide id={'errorSlide'}>
      <h2 style={{ marginBottom: 25 }}>Crap! Something funky happened.</h2>
      <p style={{ textAlign: 'justify' }}>
        Alright. This entire install script is in <i>beta</i>. Didn&apos;t I mention that? Anyway, there are a couple of
        options below to try and resolve the issue. There are some common pit falls and workarounds in the docs that may
        help. Submitting the issue will help identify any bugs in the script and will help others as well.
      </p>
      <pre style={{ textAlign: 'left', fontSize: 11, fontWeight: 'normal', marginBottom: 15 }}>{errorText}</pre>
      <div style={{ width: '100%' }}>
        <a
          href='https://www.github.com/polonel/trudesk/issues/new'
          target='_blank'
          rel={'noreferrer'}
          style={{ width: '100%', padding: 0, margin: 0 }}
        >
          <button
            className='btn md-btn md-btn-wave md-btn-danger'
            type='button'
            style={{ width: '100%', marginBottom: '10px !important' }}
          >
            I think I should submit this issue.
          </button>
        </a>
        <button
          className='btn md-btn md-btn-wave md-btn-success'
          type='button'
          style={{ width: '100%', marginBottom: '10px !important' }}
          onClick={() => window.location.reload()}
        >
          I think I will start over.
        </button>
        <a
          href='https://github.com/polonel/trudesk/blob/master/README.md'
          target='_blank'
          rel={'noreferrer'}
          style={{ width: '100%', padding: 0, margin: 0 }}
        >
          <button
            className='btn md-btn md-btn-wave'
            type='button'
            style={{ width: '100%', marginBottom: '10px !important' }}
          >
            or maybe I should read the docs!
          </button>
        </a>
      </div>
    </Slide>
  )
}

ErrorSlide.propTypes = {
  errorText: PropTypes.string
}

export default ErrorSlide
