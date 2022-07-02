import React, { useEffect, useRef } from 'react'

import $ from 'jquery'
import 'peity'
import PropTypes from 'prop-types'

export default function PeityLine ({ height, width, fill, stroke, values }) {
  const lineRef = useRef()
  useEffect(() => {
    if (lineRef.current) {
      $(lineRef.current).peity('line', {
        height,
        width,
        fill,
        stroke
      })
    }
  }, [])

  return (
    <div>
      <span ref={lineRef}>{values}</span>
    </div>
  )
}

PeityLine.propTypes = {
  values: PropTypes.string.isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  fill: PropTypes.string,
  stroke: PropTypes.string
}

PeityLine.defaultProps = {
  height: 28,
  width: 64,
  fill: '#d1e4f6',
  stroke: '#0288d1'
}
