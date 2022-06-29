import React, { createRef } from 'react'
import PropTypes from 'prop-types'

import $ from 'jquery'
import 'qrcode'

class QRCode extends React.Component {
  constructor (props) {
    super(props)

    this.qrcodeDiv = createRef()
  }

  componentDidMount () {
    if (this.qrcodeDiv.current) {
      const $div = $(this.qrcodeDiv.current)
      $div.qrcode({ width: this.props.size, height: this.props.size, text: this.props.code })
    }
  }

  render () {
    return (
      <div>
        <div ref={this.qrcodeDiv}></div>
      </div>
    )
  }
}

QRCode.propTypes = {
  code: PropTypes.string.isRequired,
  size: PropTypes.number
}

QRCode.defaultProps = {
  size: 240
}

export default QRCode
