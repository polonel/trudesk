import React from 'react'
import PropTypes from 'prop-types'
import Slide from 'containers/Install/Slides/Slide'

const NewOrExistingSlide = ({ slidesEl, existingClicked }) => {
  return (
    <Slide>
      <h2 style={{ marginBottom: 25 }}>Existing Database?</h2>
      <p style={{ textAlign: 'left', margiBottom: 20 }}>
        Is this mongodb connection an existing database or a new database?
      </p>
      <button
        className='btn md-btn md-btn-wave md-btn-success'
        type='button'
        style={{ margin: '0 0 10px 0 !important' }}
        onClick={() => slidesEl.current?.advanceSlides()}
      >
        New Database
      </button>
      <button
        className='btn md-btn md-btn-wave md-btn-primary'
        type='button'
        style={{ margin: 0 }}
        onClick={e => existingClicked(e)}
      >
        Existing Database
      </button>
    </Slide>
  )
}

NewOrExistingSlide.propTypes = {
  slidesEl: PropTypes.any,
  existingClicked: PropTypes.func
}

export default NewOrExistingSlide
