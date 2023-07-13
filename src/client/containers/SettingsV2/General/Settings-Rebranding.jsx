import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchSettings, updateSetting } from 'actions/settings'
import SettingItem from 'components/Settings/SettingItem'
import UploadButtonWithX from 'components/Settings/UploadButtonWithX'
import PageContent from 'components/PageContent'
import TitleContext from 'app/TitleContext'
import { Helmet } from 'react-helmet-async'
import PageTitle from 'components/PageTitle'
import Breadcrumbs from 'components/Breadcrumbs'

class SettingsRebranding extends React.Component {
  componentDidMount () {
    this.props.fetchSettings()
  }

  getSettingsValue (name) {
    return this.props.settings.getIn(['settings', name, 'value'])
      ? this.props.settings.getIn(['settings', name, 'value'])
      : ''
  }

  updateSetting (name, value, stateName) {
    this.props.updateSetting({ name, value, stateName })
  }

  render () {
    return (
      <div>
        <TitleContext.Consumer>
          {({ title }) => (
            <Helmet>
              <title>{title} Rebranding</title>
            </Helmet>
          )}
        </TitleContext.Consumer>
        <PageTitle
          breadcrumbs={
            <Breadcrumbs
              links={[
                { url: '/v2settings', title: 'Settings' },
                { url: '/v2settings/rebranding', title: 'Rebranding', active: true }
              ]}
              classes={['uk-width-1-1']}
            />
          }
        />
        <div style={{ display: 'flex', height: '100vh' }}>
          <div style={{ flexGrow: 1, padding: 15 }}>
            <SettingItem
              title='Site Logo'
              subtitle={
                <div>
                  Upload site logo to display in top navigation. <i>Note: Resize to max width of 140px</i>
                </div>
              }
              component={
                <UploadButtonWithX
                  buttonText={'Upload Logo'}
                  uploadAction={'/api/v2/settings/general/uploadlogo'}
                  extAllowed={'(jpg|jpeg|gif|png)'}
                  showX={this.getSettingsValue('hasCustomLogo')}
                  onXClick={() => {
                    this.updateSetting('gen:customlogo', false, 'hasCustomLogo')
                    setTimeout(() => {
                      window.location.reload()
                    }, 1000)
                  }}
                />
              }
            />

            <SettingItem
              title='Page Logo'
              subtitle={
                <div>
                  Upload logo to display within page views. <i>Note: Used on login page (min-width: 400px)</i>
                </div>
              }
              component={
                <UploadButtonWithX
                  buttonText={'Upload Logo'}
                  uploadAction={'/api/v2/settings/general/uploadpagelogo'}
                  extAllowed={'(jpg|jpeg|gif|png)'}
                  showX={this.getSettingsValue('hasCustomPageLogo')}
                  onXClick={() => {
                    this.updateSetting('gen:custompagelogo', false, 'hasCustomPageLogo')
                  }}
                />
              }
            />

            <SettingItem
              title='Favicon'
              subtitle={'Upload a custom favicon'}
              component={
                <UploadButtonWithX
                  buttonText={'Upload Favicon'}
                  uploadAction={'/api/v2/settings/general/uploadfavicon'}
                  extAllowed={'(jpg|jpeg|gif|png|ico)'}
                  showX={this.getSettingsValue('hasCustomFavicon')}
                  onXClick={() => {
                    this.updateSetting('gen:customfavicon', false, 'hasCustomFavicon')
                    setTimeout(() => {
                      window.location.reload()
                    }, 1000)
                  }}
                />
              }
            />
          </div>
          <div className={'info-sidebar'}>
            <h3>Site Logo</h3>
            <p>Customize the site logo displayed in the top left of the agent portal. Max supported width is 140px</p>
            <h3>Page Logo</h3>
            <p>
              Customize the page logo displayed on the login screen and a few additional full screen pages. Image is
              resized to a minimum width of 400px.
            </p>
          </div>
        </div>
      </div>
    )
  }
}

SettingsRebranding.propTypes = {
  settings: PropTypes.object.isRequired,
  fetchSettings: PropTypes.func.isRequired,
  updateSetting: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(mapStateToProps, { fetchSettings, updateSetting })(SettingsRebranding)
