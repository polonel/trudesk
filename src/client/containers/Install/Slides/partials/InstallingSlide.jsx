import React from 'react'
import PropTypes from 'prop-types'
import Slide from 'containers/Install/Slides/Slide'

const InstallingSlide = () => {
  return (
    <Slide id={'installingSlide'}>
      <h2 style={{ marginBottom: 25 }}>Installing...</h2>
      <p style={{ textAlign: 'left' }}>
        Putting it all together. Trudesk is currently building itself and powering up its engine. Please wait, this may
        take a minute.
      </p>
      <div className='loader'>
        <svg style={{ width: 140 }} viewBox='0 0 288.9 70.1'>
          <line className='l1' x1='0' y1='0' x2='288' y2='0'></line>
        </svg>
      </div>
    </Slide>
  )
}

InstallingSlide.propTypes = {}

export default InstallingSlide
