import React, { useEffect, useRef } from 'react'

import $ from 'jquery'
import 'peity'
import PropTypes from 'prop-types'

export default function PeityPie ({ type, height, width, fill, value }) {
  const pieRef = useRef()

  useEffect(() => {
    if (pieRef.current) {
      const $pieRef = $(pieRef.current)
      $pieRef.peity(type, {
        height,
        width,
        fill
      })
    }
  }, [pieRef.current])

  useEffect(() => {
    if (pieRef.current) {
      const $pieRef = $(pieRef.current)
      $pieRef.text(value).change()
    }
  }, [value])

  return (
    <div>
      <span ref={pieRef}>{value}</span>
    </div>
  )
}

PeityPie.propTypes = {
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  fill: PropTypes.arrayOf(PropTypes.string)
}

PeityPie.defaultProps = {
  type: 'pie',
  height: 24,
  width: 24,
  fill: ['#29b955', '#ccc']
}
