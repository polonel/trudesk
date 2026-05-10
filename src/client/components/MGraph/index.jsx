import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

import d3 from 'd3'
import MG from 'metricsgraphics'

const noDataDiv = <div className='no-data-available-text'>No Data Available</div>

export default function MGraph ({
  data,
  fullWidth = true,
  height,
  area = true,
  x_accessor,
  y_accessor,
  y_extended_ticks = true,
  showTooltips = false,
  aggregate_rollover = true,
  transition_on_update = false,
  colors = ['#2196f3']
}) {
  const graphRef = useRef()
  let graphParams = {}

  useEffect(() => {
    if (data && graphRef.current && data.length > 0) {
      graphRef.current.innerHTML = ''
      graphParams = {
        full_width: fullWidth,
        height,
        x_accessor,
        y_accessor,
        y_extended_ticks,
        show_tooltips: showTooltips,
        aggregate_rollover,
        transition_on_update,
        colors,
        target: graphRef.current
      }
      if (area) graphParams.area = [1]

      graphParams.data = MG.convert.date(data, 'date')
      MG.data_graphic(graphParams)
    }
  }, [data])

  return (
    <div>
      {data && data.length > 0 && <div ref={graphRef} />}
      {data && data.length < 1 && noDataDiv}
    </div>
  )
}

MGraph.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  fullWidth: PropTypes.bool,
  height: PropTypes.number,
  area: PropTypes.bool,
  x_accessor: PropTypes.string,
  y_accessor: PropTypes.string,
  y_extended_ticks: PropTypes.bool,
  showTooltips: PropTypes.bool,
  aggregate_rollover: PropTypes.bool,
  transition_on_update: PropTypes.bool,
  colors: PropTypes.arrayOf(PropTypes.string)
}
