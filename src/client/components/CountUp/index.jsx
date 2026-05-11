import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

import CountUpJS from 'countup'

export default function CountUp ({ startNumber = 0, endNumber = 0, duration = 1.5, extraText }) {
  const textRef = useRef()
  let animation = useRef()

  useEffect(() => {
    if (textRef.current) {
      textRef.current.innerText = '--'
      animation = new CountUpJS(textRef.current, startNumber, endNumber, 0, duration)
      animation.start()
    }
  }, [startNumber, endNumber])

  return (
    <div aria-live="polite" aria-atomic="true">
      <span ref={textRef} aria-hidden="false">--</span>
      {extraText && ` ${extraText}`}
    </div>
  )
}

CountUp.propTypes = {
  startNumber: PropTypes.number,
  endNumber: PropTypes.number,
  extraText: PropTypes.string,
  duration: PropTypes.number
}
