import React from 'react'
import PropTypes from 'prop-types'
import Slide from 'containers/Install/Slides/Slide'

const WelcomeSlide = ({ slidesEl }) => {
  return (
    <Slide hidden={false}>
      <h2 style={{ marginBottom: 18 }}>Welcome</h2>
      <p>
        Let&apos;s get you up and running. Let&apos;s guide you through the process of installing Trudesk. Don&apos;t
        worry, it&apos;s pretty painless.
      </p>

      <button className='btn md-btn md-btn-wave md-btn-success' onClick={() => slidesEl.current?.advanceSlides()}>
        Let&apos;s Start
      </button>
    </Slide>
  )
}

WelcomeSlide.propTypes = {
  slidesEl: PropTypes.any
}

export default WelcomeSlide
