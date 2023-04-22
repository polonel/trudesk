import React from 'react'
import PropTypes from 'prop-types'
import Slide from 'containers/Install/Slides/Slide'

const SavingConfigSlide = () => {
  return (
    <Slide id={'savingConfig'}>
      <h2 style={{ marginBottom: 25 }}>Saving Configuration...</h2>
      <p style={{ textAlign: 'left' }}>
        Currently writing trudesk configuration file to an existing MongoDB connection. Please wait, this should only
        take a second.
      </p>
      <div className='loader'>
        <svg style={{ width: 140 }} viewBox='0 0 288.9 70.1'>
          <line className='l1' x1='0' y1='0' x2='288' y2='0'></line>
        </svg>
      </div>
    </Slide>
  )
}

SavingConfigSlide.propTypes = {}

export default SavingConfigSlide
