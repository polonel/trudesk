import React, { useEffect } from 'react'
import { Responsive as ResponsiveGrid } from 'react-grid-layout'
import { withSize } from 'react-sizeme'

import TruCard from 'components/TruCard'
import PropTypes from 'prop-types'

import helpers from 'lib/helpers'

const initialLayouts = {
  lg: [
    { i: 'card-tickets-completed', x: 4, y: 0, w: 4, h: 1 },
    { i: 'card-avg-response-time', x: 8, y: 0, w: 4, h: 1 }
  ]
}

function RGrid ({ size: { width, height } }) {
  window.onresize = function () {
    console.log(height)
  }

  useEffect(() => {
    helpers.resizeFullHeight()
  }, [])

  const layouts = {
    lg: [
      { i: 'a', x: 0, y: 0, w: 1, h: 2 },
      { i: 'b', x: 1, y: 0, w: 3, h: 2 },
      { i: 'c', x: 4, y: 0, w: 1, h: 2 },
      { i: 'd', x: 0, y: 2, w: 2, h: 2 }
    ]
  }

  return (
    <ResponsiveGrid
      className='uk-height-1-1'
      layouts={initialLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={85}
      width={width}
      compactType={null}
      // isBounded={true}
    >
      <div key='card-total-tickets' data-grid={{ x: 0, y: 0, w: 4, h: 1, static: true }}>
        <Widget id='card-total-tickets' backgroundColor='#867ae9' />
      </div>
      <div key='card-tickets-completed'>
        <Widget id='b' backgroundColor='#fff5ab' />
      </div>
      <div key='card-avg-response-time'>
        <Widget id='c' backgroundColor='#ffcead' />
      </div>
      <div key='d'>
        <Widget id='d' backgroundColor='#c449c2' />
      </div>
    </ResponsiveGrid>
  )
}

RGrid.propTypes = {
  size: PropTypes.object.isRequired
}

function Widget ({ id, backgroundColor }) {
  // return <div style={{ backgroundColor }}>{id}</div>
  return <TruCard header={null} content={<div>Testing {id}</div>} fullSize={true} />
}

export default withSize({ refreshMode: 'debounce', refreshRate: 60, monitorHeight: true })(RGrid)
