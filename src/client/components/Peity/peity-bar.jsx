import React, { useEffect, useRef } from 'react'

import $ from 'jquery'
import 'peity'
import PropTypes from 'prop-types'

export default function PeityBar (props) {
  const barRef = useRef()

  useEffect(() => {
    if (barRef.current) {
      $(barRef.current).peity('bar', {
        height: props.height,
        width: props.width,
        fill: props.fill,
        padding: props.padding
      })
    }
  }, [])

  return (
    <div>
      <span ref={barRef}>{props.values}</span>
    </div>
  )
}

PeityBar.propTypes = {
  values: PropTypes.string.isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  fill: PropTypes.arrayOf(PropTypes.string),
  padding: PropTypes.number
}

PeityBar.defaultProps = {
  height: 28,
  width: 48,
  fill: ['#e74c3c'],
  padding: 0.2
}
