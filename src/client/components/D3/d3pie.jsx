import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { shuffle, map, zipObject } from 'lodash'

import * as d3 from 'vendor/d3/d3.min'
import 'd3pie'
import * as c3 from 'c3'

export default function D3Pie (props) {
  const pieChart = useRef()
  let mappedColors = []

  useEffect(() => {
    if (pieChart.current) {
      mappedColors = shuffle(props.colors)
      mappedColors = zipObject(
        map(props.data, v => v[0]),
        mappedColors
      )

      c3.generate({
        bindto: d3.select(pieChart.current),
        size: {
          height: props.size
        },
        data: {
          columns: props.data,
          type: props.type,
          colors: mappedColors,
          empty: { label: { text: props.emptyLabel } }
        },
        donut: {
          label: {
            format: () => ''
          }
        }
      })
    }
  }, [pieChart.current, props.data])

  return (
    <div>
      <div ref={pieChart} role="img" aria-label="Pie chart showing data distribution"></div>
    </div>
  )
}

D3Pie.propTypes = {
  data: PropTypes.array.isRequired,
  type: PropTypes.string,
  size: PropTypes.number,
  emptyLabel: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.string)
}

D3Pie.defaultProps = {
  data: [],
  type: 'pie',
  size: 200,
  emptyLabel: 'No Data Available',
  colors: [
    '#e74c3c',
    '#3498db',
    '#9b59b6',
    '#34495e',
    '#1abc9c',
    '#2ecc71',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#FF5722',
    '#CDDC39',
    '#FFC107',
    '#00E5FF',
    '#E040FB',
    '#607D8B'
  ]
}
