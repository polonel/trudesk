import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import useTrudeskReady from 'lib/useTrudeskReady'

import CountUpJS from 'countup'

export default function CountUp (props) {
  const textRef = useRef()
  let animation = useRef()

  // useTrudeskReady(() => {
  //   if (textRef.current) {
  //     textRef.current.innerText = '--'
  //     animation = new CountUpJS(textRef.current, props.startNumber, props.endNumber, 0, props.duration)
  //     setTimeout(() => {
  //       animation.start()
  //     }, 500)
  //   }
  // })

  useEffect(() => {
    if (textRef.current) {
      textRef.current.innerText = '--'
      animation = new CountUpJS(textRef.current, props.startNumber, props.endNumber, 0, props.duration)
      animation.start()
    }
  }, [props.startNumber, props.endNumber])

  return (
    <div>
      <span ref={textRef}>--</span>
      {props.extraText && ` ${props.extraText}`}
    </div>
  )
}

CountUp.propTypes = {
  startNumber: PropTypes.number,
  endNumber: PropTypes.number,
  extraText: PropTypes.string,
  duration: PropTypes.number
}

CountUp.defaultProps = {
  startNumber: 0,
  endNumber: 0,
  duration: 1.5
}
