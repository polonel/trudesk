import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { MdOutlineArrowForwardIos } from 'react-icons/md'

import './breadcrumbs.sass'

class Breadcrumbs extends React.Component {
  constructor (props) {
    super(props)
  }

  render () {
    const { classes, inPageTitle } = this.props
    const style = inPageTitle ? { height: 69 } : {}
    return (
      <div className={clsx('breadcrumbs', classes)} style={style}>
        {this.props.links.map(link => {
          if (link.active) {
            return <h4 key={link.url}>{link.title}</h4>
          } else {
            return (
              <Fragment key={link.url}>
                <Link to={link.url} className={clsx(link.active && 'active')}>
                  {link.title}
                </Link>
                <MdOutlineArrowForwardIos style={{ width: 16, height: 16 }} />
              </Fragment>
            )
          }
        })}
      </div>
    )
  }
}

Breadcrumbs.propTypes = {
  links: PropTypes.arrayOf(PropTypes.object).isRequired,
  classes: PropTypes.arrayOf(PropTypes.string),
  inPageTitle: PropTypes.bool.isRequired
}

Breadcrumbs.defaultProps = {
  inPageTitle: true
}

export default Breadcrumbs
