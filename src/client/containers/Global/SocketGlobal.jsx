import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { initSocket, updateSocket } from 'actions/common'
import helpers from 'lib/helpers'
import TicketSocketEvents from 'lib2/socket/ticketSocketEvents'

class SocketGlobal extends React.Component {
  constructor (props) {
    super(props)

    this.onSocketInitialized = this.onSocketInitialized.bind(this)
    this.refreshSocketState = this.refreshSocketState.bind(this)
    this.onReconnect = this.onReconnect.bind(this)
    this.onDisconnect = this.onDisconnect.bind(this)

    this.props.initSocket().then(this.onSocketInitialized)
  }

  componentWillUnmount () {
    if (this.props.socket) {
      this.props.socket.off('connect', this.refreshSocketState)
      this.props.socket.off('connecting', this.refreshSocketState)
      this.props.socket.io.off('reconnect', this.onReconnect)
      this.props.socket.off('disconnect', this.onDisconnect)
    }
  }

  onSocketInitialized () {
    this.props.socket.on('connect', this.onReconnect)
    this.props.socket.on('connecting', this.refreshSocketState)
    this.props.socket.io.on('reconnect', this.onReconnect)
    this.props.socket.on('disconnect', this.onDisconnect)

    // Load any initial socket stuff
  }

  onDisconnect (socket) {
    helpers.UI.showDisconnectedOverlay()
    this.refreshSocketState({ socket })

    const self = this
    this.props.socket.io.removeAllListeners('reconnect_attempt')
    this.props.socket.io.on('reconnect_attempt', function (s) {
      helpers.UI.showDisconnectedOverlay()
      self.refreshSocketState({ socket: s })
    })

    this.props.socket.removeAllListeners('connect_timeout')
    this.props.socket.on('connect_timeout', function (s) {
      helpers.UI.showDisconnectedOverlay()
      self.refreshSocketState({ socket: s })
    })
  }

  onReconnect (socket) {
    helpers.UI.hideDisconnectedOverlay()
    this.props.updateSocket({ socket })
  }

  refreshSocketState (socket) {
    this.props.updateSocket({ socket })
  }

  render () {
    return (
      <>
        <TicketSocketEvents />
      </>
    )
  }
}

SocketGlobal.propTypes = {
  initSocket: PropTypes.func.isRequired,
  updateSocket: PropTypes.func.isRequired,
  socket: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  socket: state.shared.socket
})

export default connect(mapStateToProps, { initSocket, updateSocket })(SocketGlobal)
