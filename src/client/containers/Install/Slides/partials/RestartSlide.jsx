import React from 'react'
import PropTypes from 'prop-types'
import Slide from 'containers/Install/Slides/Slide'
import axios from 'axios'

const RestartSlide = () => {
  const restartTrudesk = e => {
    const element = e.target
    if (!element) return

    element.classList.add('hide')
    element.parentElement.querySelector('h2').innerHTML = 'Restarting...'
    element.parentElement.querySelector('p').innerHTML = "I'm restarting now... Give me about 10 seconds!"
    element.parentElement.querySelector('p').style.textAlign = 'center'

    setTimeout(() => {
      window.location.reload()
    }, 10000)

    axios.post('/install/restart')
  }

  return (
    <Slide id={'restartSlide'}>
      <h2 style={{ marginBottom: 25 }}>Time to Restart</h2>
      <p style={{ textAlign: 'left' }}>
        <i>So here we are, together sharpening a knife.</i> Trudesk needs to restart to come out of install mode. Just
        restart it and you should get a login screen. (hopefully)!
      </p>
      <button className='btn md-btn md-btn-wave' type='button' onClick={e => restartTrudesk(e)}>
        restart me!
      </button>
    </Slide>
  )
}

RestartSlide.propTypes = {}

export default RestartSlide
