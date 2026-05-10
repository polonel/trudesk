import React, { useEffect, useRef } from 'react'

import $ from 'jquery'
import 'peity'
import PropTypes from 'prop-types'

export default function PeityBar ({ values, height = 28, width = 48, fill = ['#e74c3c'], padding = 0.2 }) {
  const barRef = useRef()

  useEffect(() => {
    if (barRef.current) {
      $(barRef.current).peity('bar', { height, width, fill, padding })
    }
  }, [])

  return (
    <div>
      <span ref={barRef}>{values}</span>
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
