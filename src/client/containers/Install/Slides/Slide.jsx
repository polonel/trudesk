import React from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'

const Slide = ({ children, hidden, id }) => {
  return (
    <div id={id} className={clsx('slide', hidden && 'hide')}>
      {children}
    </div>
  )
}

Slide.propTypes = {
  children: PropTypes.any,
  hidden: PropTypes.bool,
  id: PropTypes.string
}

Slide.defaultProps = {
  hidden: true
}

export default Slide
