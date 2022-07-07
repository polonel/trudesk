import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import ReactHotkeys from 'react-hot-keys'

class HotKeysGlobal extends React.Component {
  keyList = ['g+d', 'g+t', 'shift+/']

  onKeyDown (keyName, e, handle) {
    // Route Change
    if (keyName === 'g+d') History.pushState(null, null, '/dashboard')
    if (keyName === 'g+t') History.pushState(null, null, '/tickets/active')

    if (keyName === 'ctrl+g') console.log('split key')

    // Help
    if (keyName === 'shift+/') console.log('Show shortcut help')
  }

  render () {
    const hasKeyboardShortcutEnabled = this.props.sessionUser
      ? this.props.sessionUser.preferences.keyboardShortcuts
      : true
    return (
      <>
        {hasKeyboardShortcutEnabled && (
          <ReactHotkeys keyName={this.keyList.join(',')} onKeyDown={this.onKeyDown.bind(this)} />
        )}
      </>
    )
  }
}

HotKeysGlobal.propTypes = {
  sessionUser: PropTypes.object
}

const mapStateToProps = state => ({
  sessionUser: state.shared.sessionUser
})

export default connect(mapStateToProps, {})(HotKeysGlobal)
