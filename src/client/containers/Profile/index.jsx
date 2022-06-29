import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observer } from 'mobx-react'
import { makeObservable, observable } from 'mobx'

import { saveProfile } from 'actions/accounts'
import { setSessionUser } from 'actions/common'

import PageTitle from 'components/PageTitle'
import PageContent from 'components/PageContent'
import TruCard from 'components/TruCard'
import Avatar from 'components/Avatar/Avatar'
import Button from 'components/Button'
import Spacer from 'components/Spacer'
import TruTabWrapper from 'components/TruTabs/TruTabWrapper'
import TruTabSelectors from 'components/TruTabs/TruTabSelectors'
import TruTabSelector from 'components/TruTabs/TruTabSelector'
import TruTabSection from 'components/TruTabs/TruTabSection'
import Input from 'components/Input'
import QRCode from 'components/QRCode'
import TruAccordion from 'components/TruAccordion'

@observer
class ProfileContainer extends React.Component {
  @observable editingProfile = false

  @observable fullname = null
  @observable title = null
  @observable workNumber = null
  @observable mobileNumber = null
  @observable companyName = null
  @observable facebookUrl = null
  @observable linkedinUrl = null
  @observable twitterUrl = null

  // Security
  // -- Password
  @observable currentPassword = null
  @observable newPassword = null
  @observable confirmPassword = null

  constructor (props) {
    super(props)

    makeObservable(this)
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    // This should load initial state values
    if (prevProps.sessionUser === null && this.props.sessionUser !== null) {
      this.fullname = this.props.sessionUser.fullname
      this.title = this.props.sessionUser.title
      this.workNumber = this.props.sessionUser.workNumber
      this.mobileNumber = this.props.sessionUser.mobileNumber
      this.companyName = this.props.sessionUser.companyName
      this.facebookUrl = this.props.sessionUser.facebookUrl
      this.linkedinUrl = this.props.sessionUser.linkedinUrl
      this.twitterUrl = this.props.sessionUser.twitterUrl
    }
  }

  onSaveProfileClicked = e => {
    e.preventDefault()
    this.props
      .saveProfile({
        _id: this.props.sessionUser._id,
        username: this.props.sessionUser.username,

        fullname: this.fullname,
        title: this.title,
        workNumber: this.workNumber,
        mobileNumber: this.mobileNumber,
        companyName: this.companyName,
        facebookUrl: this.facebookUrl,
        linkedinUrl: this.linkedinUrl,
        twitterUrl: this.twitterUrl
      })
      .then(() => {
        this.editingProfile = false
        this.props.setSessionUser()
      })
  }

  onUpdatePasswordClicked = e => {
    e.preventDefault()
  }

  render () {
    if (!this.props.sessionUser) return <div />

    const InfoItem = ({ label, prop, paddingLeft, paddingRight, isRequired, onUpdate }) => {
      return (
        <div style={{ width: '33%', paddingRight: paddingRight, paddingLeft: paddingLeft }}>
          <label style={{ cursor: 'default', fontSize: '13px', fontWeight: 400, marginRight: 15 }}>
            {label}
            {isRequired && <span style={{ color: 'red' }}>*</span>}
          </label>
          <Spacer top={5} bottom={0} />
          {this.editingProfile && <Input defaultValue={prop || ''} onChange={onUpdate} />}
          {!this.editingProfile && (
            <p
              style={{
                fontSize: '14px',
                lineHeight: '21px',
                margin: 0,
                fontWeight: 600,
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {prop || '-'}
            </p>
          )}
        </div>
      )
    }

    return (
      <>
        <PageTitle title={'Profile'} />
        {/*<QRCode*/}
        {/*  code={*/}
        {/*    'otpauth://totp/trudesk.granvillecounty.org-chris.brame:trudesk.granvillecounty.org-chris.brame?secret=KJJFEU22JBCA&issuer=Trudesk'*/}
        {/*  }*/}
        {/*/>*/}
        <PageContent>
          <TruCard
            header={<div />}
            hover={false}
            content={
              <>
                <div className={'uk-position-relative'}>
                  <Avatar
                    userId={this.props.sessionUser._id}
                    image={this.props.sessionUser.image}
                    enableImageUpload={true}
                    username={this.props.sessionUser.username}
                    socket={this.props.socket}
                    showOnlineBubble={false}
                    showBorder={true}
                    size={72}
                  />
                  <div className={'uk-clearfix'} style={{ paddingLeft: 85 }}>
                    <h2
                      className={'ml-15'}
                      style={{ fontSize: 24, lineHeight: '36px', letterSpacing: '0.5px', fontWeight: 600 }}
                    >
                      {this.props.sessionUser.fullname}
                    </h2>
                    <p className={'ml-15'} style={{ lineHeight: '9px' }}>
                      <span style={{ marginRight: 10 }}>{this.props.sessionUser.email}</span>|
                      <span style={{ margin: '0 10px' }}>{this.props.sessionUser.title}</span>|
                      <span
                        style={{
                          boxSizing: 'border-box',
                          margin: '0 10px',
                          padding: '5px 8px',
                          background: '#d9eeda',
                          border: '1px solid #b5dfb7',
                          borderRadius: 3,
                          color: '#4caf50'
                        }}
                      >
                        {this.props.sessionUser.role.name.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <Button
                    text={'Edit Profile'}
                    small={true}
                    waves={true}
                    style={'primary'}
                    styleOverride={{ position: 'absolute', top: '5px', right: 5 }}
                    disabled={this.editingProfile}
                    onClick={() => {
                      this.fullname = this.props.sessionUser.fullname
                      this.editingProfile = !this.editingProfile
                    }}
                  />
                </div>
              </>
            }
          />
          <Spacer />
          <TruCard
            hover={false}
            content={
              <div>
                <TruTabWrapper style={{ padding: '0' }}>
                  <TruTabSelectors showTrack={true}>
                    <TruTabSelector selectorId={0} label={'Profile'} active={false} />
                    <TruTabSelector selectorId={1} label={'Security'} active={true} />
                  </TruTabSelectors>
                  <TruTabSection sectionId={0} active={false} style={{ minHeight: 480 }}>
                    <div style={{ maxWidth: 900, padding: '10px 25px' }}>
                      <h4 style={{ marginBottom: 15 }}>Work Information</h4>
                      <div style={{ display: 'flex' }}>
                        <InfoItem
                          label={'Name'}
                          prop={this.props.sessionUser.fullname}
                          paddingLeft={0}
                          paddingRight={30}
                          isRequired={true}
                          onUpdate={val => (this.fullname = val)}
                        />
                        <InfoItem
                          label={'Title'}
                          prop={this.props.sessionUser.title}
                          paddingLeft={30}
                          paddingRight={30}
                          onUpdate={val => (this.title = val)}
                        />
                        <InfoItem
                          label={'Company Name'}
                          prop={this.props.sessionUser.companyName}
                          paddingRight={0}
                          paddingLeft={30}
                          onUpdate={val => (this.companyName = val)}
                        />
                      </div>
                      <div style={{ display: 'flex', marginTop: 25 }}>
                        <InfoItem
                          label={'Work Number'}
                          prop={this.props.sessionUser.workNumber}
                          paddingRight={30}
                          paddingLeft={0}
                          onUpdate={val => (this.workNumber = val)}
                        />
                        <InfoItem
                          label={'Mobile Number'}
                          prop={this.props.sessionUser.mobileNumber}
                          paddingLeft={30}
                          paddingRight={0}
                          onUpdate={val => (this.mobileNumber = val)}
                        />
                      </div>
                      <Spacer top={25} bottom={25} showBorder={true} />
                      <h4 style={{ marginBottom: 15 }}>Other Information</h4>
                      <div style={{ display: 'flex', marginTop: 25 }}>
                        <InfoItem
                          label={'Facebook Url'}
                          prop={this.props.sessionUser.facebookUrl}
                          paddingLeft={0}
                          paddingRight={30}
                          onUpdate={val => (this.facebookUrl = val)}
                        />
                        <InfoItem
                          label={'LinkedIn Url'}
                          prop={this.props.sessionUser.linkedinUrl}
                          paddingLeft={30}
                          paddingRight={30}
                          onUpdate={val => (this.linkedinUrl = val)}
                        />
                        <InfoItem
                          label={'Twitter Url'}
                          prop={this.props.sessionUser.twitterUrl}
                          paddingLeft={30}
                          paddingRight={0}
                          onUpdate={val => (this.twitterUrl = val)}
                        />
                      </div>
                      {this.editingProfile && (
                        <div className={'uk-display-flex uk-margin-large-top'}>
                          <Button
                            text={'Save'}
                            style={'primary'}
                            small={true}
                            onClick={e => this.onSaveProfileClicked(e)}
                          />
                          <Button text={'Cancel'} small={true} onClick={() => (this.editingProfile = false)} />
                        </div>
                      )}
                    </div>
                  </TruTabSection>
                  <TruTabSection sectionId={1} style={{ minHeight: 480 }} active={true}>
                    <div style={{ maxWidth: 600, padding: '25px 0' }}>
                      <TruAccordion
                        headerContent={'Change Password'}
                        content={
                          <div>
                            <div
                              className={'uk-alert uk-alert-warning'}
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              <i className='material-icons mr-10' style={{ opacity: 0.5 }}>
                                info
                              </i>
                              <p style={{ lineHeight: '18px' }}>
                                After changing your password, you will be logged out of all sessions.
                              </p>
                            </div>
                            <div>
                              <div className={'uk-margin-medium-bottom'}>
                                <label>Current Password</label>
                                <Input type={'password'} onChange={v => (this.currentPassword = v)} />
                              </div>
                              <div className={'uk-margin-medium-bottom'}>
                                <label>New Password</label>
                                <Input type={'password'} onChange={v => (this.newPassword = v)} />
                              </div>
                              <div className={'uk-margin-medium-bottom'}>
                                <label>Confirm Password</label>
                                <Input type={'password'} onChange={v => (this.confirmPassword = v)} />
                              </div>
                            </div>
                          </div>
                        }
                      />
                      <TruAccordion
                        startExpanded={true}
                        headerContent={'Two-Factor Authentication'}
                        content={
                          <div>
                            <h4 style={{ fontWeight: 500 }}>Two-factor authentication is not enabled yet</h4>
                          </div>
                        }
                      />
                    </div>
                  </TruTabSection>
                </TruTabWrapper>
              </div>
            }
          />
        </PageContent>
      </>
    )
  }
}

ProfileContainer.propTypes = {
  sessionUser: PropTypes.object,
  setSessionUser: PropTypes.func.isRequired,
  socket: PropTypes.object.isRequired,
  saveProfile: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  sessionUser: state.shared.sessionUser,
  socket: state.shared.socket
})

export default connect(mapStateToProps, { saveProfile, setSessionUser })(ProfileContainer)
