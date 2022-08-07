import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'

import { setSessionUser, showModal } from 'actions/common'
import { saveEditAccount } from 'actions/accounts'

import Avatar from 'components/Avatar/Avatar'
import EnableSwitch from 'components/Settings/EnableSwitch'
import PDropdown from 'components/PDropdown'
import Spacer from 'components/Spacer'

import helpers from 'lib/helpers'

@observer
class ProfileDropdownPartial extends React.Component {
  @observable keyboardShortcutsChecked = true

  constructor (props) {
    super(props)

    makeObservable(this)
  }

  componentDidMount () {
    // helpers.ajaxify('#profile-drop')

    if (this.props.sessionUser && this.props.sessionUser.preferences)
      this.keyboardShortcutsChecked = this.props.sessionUser.preferences.keyboardShortcuts
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (prevProps.sessionUser !== this.props.sessionUser && this.props.sessionUser.preferences) {
      this.keyboardShortcutsChecked = this.props.sessionUser.preferences.keyboardShortcuts
    }
  }

  onKeyboardShortcutsChanged (e) {
    const checked = e.target.checked
    this.props
      .saveEditAccount({
        hideSnackbar: true,
        username: this.props.sessionUser.username,
        preferences: {
          keyboardShortcuts: checked
        }
      })
      .then(() => {
        this.props.setSessionUser()
      })
  }

  render () {
    return (
      <PDropdown
        ref={this.props.forwardedRef}
        id={'profile-drop'}
        className={'profile-drop'}
        showTitlebar={false}
        minHeight={185} // 255 with keyboard shortcuts
        minWidth={350}
        topOffset={-5}
        leftOffset={-70}
        showArrow={false}
        isListItems={false}
      >
        <div className={'pdrop-content'}>
          <div className={'user-section padding-15 uk-clearfix'}>
            <div className={'user-info'}>
              <Avatar
                image={this.props.sessionUser.image || 'defaultProfile.jpg'}
                showOnlineBubble={false}
                style={{ marginLeft: 5, marginRight: 15 }}
                size={60}
              />
              <div className={'user-info-items'}>
                <span className={'uk-text-bold'} style={{ fontSize: '16px', lineHeight: '22px' }}>
                  {this.props.sessionUser.fullname}
                </span>
                <span>{this.props.sessionUser.email}</span>
                <Link to='/profile'>Profile Settings</Link>
              </div>
            </div>
          </div>
          {/*<Spacer showBorder={true} borderSize={1} top={0} bottom={0} />*/}
          {/*<div className={'user-action-items'}>*/}
          {/*  <EnableSwitch*/}
          {/*    label={'Keyboard Shortcuts'}*/}
          {/*    sublabel={*/}
          {/*      <>*/}
          {/*        {this.keyboardShortcutsChecked && (*/}
          {/*          <div className={'sub-label'}>*/}
          {/*            Press <code>?</code> to view{' '}*/}
          {/*            <a href='#' className={'no-ajaxy'}>*/}
          {/*              Shortcuts*/}
          {/*            </a>*/}
          {/*          </div>*/}
          {/*        )}*/}
          {/*      </>*/}
          {/*    }*/}
          {/*    stateName={'keyboard-shortcuts-enable-switch'}*/}
          {/*    checked={this.keyboardShortcutsChecked}*/}
          {/*    onChange={e => this.onKeyboardShortcutsChanged(e)}*/}
          {/*  />*/}
          {/*</div>*/}
          <Spacer showBorder={true} borderSize={1} top={0} bottom={0} />
          {/*<div className={'profile-drop-dark-section'}></div>*/}
          {/*<Spacer showBorder={true} borderSize={1} top={0} bottom={0} />*/}
          <div className={'profile-drop-actions'}>
            <div className={'action-logout'}>
              <i className='material-icons'>logout</i>
              <Link to='/logout'>Logout</Link>
            </div>
          </div>
        </div>
        <div className={'pdrop-footer'}>
          <div className='links'>
            <a href='https://forum.trudesk.io' target={'_blank'} rel={'noreferrer'}>
              Community
            </a>
            <span>&middot;</span>
            <a
              href='#'
              className={'no-ajaxy'}
              onClick={e => {
                e.preventDefault()
                helpers.hideAllpDropDowns()
                this.props.showModal('PRIVACY_POLICY')
              }}
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </PDropdown>
    )
  }
}

ProfileDropdownPartial.propTypes = {
  sessionUser: PropTypes.object.isRequired,
  setSessionUser: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  saveEditAccount: PropTypes.func.isRequired,
  forwardedRef: PropTypes.any
}

const mapStateToProps = state => ({
  sessionUser: state.shared.sessionUser
})

export default connect(mapStateToProps, { setSessionUser, showModal, saveEditAccount }, null, { forwardRef: true })(
  ProfileDropdownPartial
)
