import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'
import clsx from 'clsx'

import { BACKUP_RESTORE_UI_SHOW_OVERLAY, BACKUP_RESTORE_UI_COMPLETE } from 'serverSocket/socketEventConsts'

@observer
class BackupRestoreOverlay extends React.Component {
  @observable overlayActive = false

  constructor (props) {
    super(props)

    makeObservable(this)

    this.onShowRestoreOverlay = this.onShowRestoreOverlay.bind(this)
    this.onRestoreComplete = this.onRestoreComplete.bind(this)
  }

  componentDidMount () {
    this.props.socket.on(BACKUP_RESTORE_UI_SHOW_OVERLAY, this.onShowRestoreOverlay)
    this.props.socket.on(BACKUP_RESTORE_UI_COMPLETE, this.onRestoreComplete)
  }

  componentWillUnmount () {
    this.props.socket.off(BACKUP_RESTORE_UI_SHOW_OVERLAY, this.onShowRestoreOverlay)
    this.props.socket.off(BACKUP_RESTORE_UI_COMPLETE, this.onRestoreComplete)
  }

  onShowRestoreOverlay () {
    this.overlayActive = true
  }

  onRestoreComplete () {
    location.reload()
  }

  render () {
    return (
      <div
        id='restoreBackupOverlay'
        className={clsx('loader-wrapper', !this.overlayActive && 'hide')}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#ddd', zIndex: 999998 }}
      >
        <div className='page-center'>
          <h1 className='text-light' style={{ color: '#444' }}>
            Restore in Progress...
          </h1>
          <div className='uk-progress uk-progress-striped uk-progress-accent uk-active' style={{ height: '31px' }}>
            <div className='uk-progress-bar' style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    )
  }
}

BackupRestoreOverlay.propTypes = {
  socket: PropTypes.object.isRequired
}

BackupRestoreOverlay.defaultProps = {}

const mapStateToProps = state => ({
  socket: state.shared.socket
})

export default connect(mapStateToProps, {})(BackupRestoreOverlay)
