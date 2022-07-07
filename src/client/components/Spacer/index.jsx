import React from 'react'
import PropTypes from 'prop-types'

class Spacer extends React.Component {
  render () {
    return (
      <div style={{ display: 'block', marginTop: this.props.top, marginBottom: this.props.bottom }}>
        {this.props.showBorder && <hr style={{ display: 'block', margin: 0, height: this.props.borderSize }} />}
      </div>
    )
  }
}

Spacer.propTypes = {
  top: PropTypes.number,
  bottom: PropTypes.number,
  showBorder: PropTypes.bool,
  // borderColor: PropTypes.string,
  borderSize: PropTypes.number
}

Spacer.defaultProps = {
  top: 15,
  bottom: 15,
  showBorder: false,
  borderSize: 2
}

export default Spacer
