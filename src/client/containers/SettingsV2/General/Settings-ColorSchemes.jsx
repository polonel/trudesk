import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet-async'
import { fetchSettings, updateColorScheme, updateSetting } from 'actions/settings'
import colorMap from 'lib/themeColors'
import SettingItem from 'components/Settings/SettingItem'
import EnableSwitch from 'components/Settings/EnableSwitch'
import Zone from 'components/ZoneBox/zone'
import ZoneBox from 'components/ZoneBox'
import SettingSubItem from 'components/Settings/SettingSubItem'
import SingleSelect from 'components/SingleSelect'
import Button from 'components/Button'
import ColorSelector from 'components/ColorSelector'
import TitleContext from 'app/TitleContext'
import PageTitle from 'components/PageTitle'
import Breadcrumbs from 'components/Breadcrumbs'

class SettingsColorSchemes extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedColorScheme: 'light',
      themeAutoDark: false,
      themeLight: 'light',
      themeDark: 'noctis'
    }
  }

  componentDidMount () {
    this.props.fetchSettings()
  }

  componentDidUpdate () {
    const colorScheme = this.calcColorScheme()
    if (this.state.selectedColorScheme !== colorScheme) {
      this.setState({
        selectedColorScheme: colorScheme
      })
    }

    const themeAutoDark = this.getSettingsValue('themeAutoDark')
    if (this.state.themeAutoDark !== themeAutoDark) {
      this.setState({
        themeAutoDark: themeAutoDark
      })
    }

    const themeLight = this.getSettingsValue('themeLight')
    if (this.state.themeLight !== themeLight) {
      this.setState({
        themeLight: themeLight
      })
    }

    const themeDark = this.getSettingsValue('themeDark')
    if (this.state.themeDark !== themeDark) {
      this.setState({
        themeDark: themeDark
      })
    }
  }

  getSettingsValue (name) {
    return this.props.settings.getIn(['settings', name, 'value'])
      ? this.props.settings.getIn(['settings', name, 'value'])
      : ''
  }

  updateSetting (name, value, stateName) {
    this.props.updateSetting({ name, value, stateName })
  }

  calcColorScheme () {
    let colorScheme = 'light'
    if (this.getSettingsValue('colorSecondary') === '#2f3640') colorScheme = 'dark'
    else if (this.getSettingsValue('colorHeaderBG') === '#112d4e') colorScheme = 'bluejean'
    else if (this.getSettingsValue('colorTertiary') === '#ee2b47') colorScheme = 'midnight'
    else if (this.getSettingsValue('colorHeaderBG') === '#2e3238') colorScheme = 'moonlight'
    else if (this.getSettingsValue('colorTertiary') === '#f67280') colorScheme = 'purplerain'
    else if (this.getSettingsValue('colorHeaderBG') === '#625757') colorScheme = 'sandstone'
    else if (this.getSettingsValue('colorHeaderBG') === '#404969') colorScheme = 'winterfire'
    else if (this.getSettingsValue('colorHeaderBG') === '#242e42') colorScheme = 'noctis'

    return colorScheme
  }

  onBuiltInColorSelectChange (e) {
    if (!e.target || !e.target.value) return
    this.headerBGColorSelect.setState(
      { selectedColor: colorMap[e.target.value].headerBG },
      this.headerBGColorSelect.updateColorButton
    )
    this.headerPrimaryColorSelect.setState(
      { selectedColor: colorMap[e.target.value].headerPrimary },
      this.headerPrimaryColorSelect.updateColorButton
    )
    this.primaryColorSelect.setState(
      { selectedColor: colorMap[e.target.value].primary },
      this.primaryColorSelect.updateColorButton
    )
    this.secondaryColorSelect.setState(
      { selectedColor: colorMap[e.target.value].secondary },
      this.secondaryColorSelect.updateColorButton
    )
    this.tertiaryColorSelect.setState(
      { selectedColor: colorMap[e.target.value].tertiary },
      this.tertiaryColorSelect.updateColorButton
    )
    this.quaternaryColorSelect.setState(
      { selectedColor: colorMap[e.target.value].quaternary },
      this.quaternaryColorSelect.updateColorButton
    )
  }

  saveColorScheme () {
    const colors = [
      { name: 'color:headerbg', value: this.headerBGColorSelect.state.selectedColor },
      { name: 'color:headerprimary', value: this.headerPrimaryColorSelect.state.selectedColor },
      { name: 'color:primary', value: this.primaryColorSelect.state.selectedColor },
      { name: 'color:secondary', value: this.secondaryColorSelect.state.selectedColor },
      { name: 'color:tertiary', value: this.tertiaryColorSelect.state.selectedColor },
      { name: 'color:quaternary', value: this.quaternaryColorSelect.state.selectedColor }
    ]

    this.props.updateColorScheme(colors)
  }

  render () {
    return (
      <div>
        <TitleContext.Consumer>
          {({ title }) => (
            <Helmet>
              <title>{title} Color Schemes</title>
            </Helmet>
          )}
        </TitleContext.Consumer>
        <PageTitle
          breadcrumbs={
            <Breadcrumbs
              links={[
                { url: '/v2settings', title: 'Settings' },
                { url: '/v2settings/colorschemes', title: 'Color Schemes', active: true }
              ]}
              classes={['uk-width-1-1']}
            />
          }
        />
        <div style={{ display: 'flex', height: '100vh' }}>
          <div style={{ flexGrow: 1, padding: 15 }}>
            <SettingItem
              title='Auto Dark Theme'
              subtitle={
                <div>
                  Automatically change theme base on system settings.{' '}
                  <i>Note: Currently only supports built-in themes</i>
                </div>
              }
              component={
                <EnableSwitch
                  stateName={'themeAutoDark'}
                  label={'Enable'}
                  checked={this.state.themeAutoDark}
                  onChange={e => {
                    this.updateSetting('theme:autodark', e.target.checked, 'themeAutoDark')
                  }}
                />
              }
            >
              <Zone>
                <ZoneBox>
                  <SettingSubItem
                    title={'Light Theme'}
                    subtitle={'Light theme to display'}
                    component={
                      <SingleSelect
                        width='60%'
                        showTextbox={false}
                        items={[
                          { text: 'Light (Default)', value: 'light' },
                          { text: 'Dark', value: 'dark' },
                          { text: 'Noctis', value: 'noctis' },
                          { text: 'Blue Jean', value: 'bluejean' },
                          { text: 'Midnight', value: 'midnight' },
                          { text: 'Moonlight', value: 'moonlight' },
                          { text: 'Purple Rain', value: 'purplerain' },
                          { text: 'Sandstone', value: 'sandstone' },
                          { text: "Winter's Fire", value: 'winterfire' }
                        ]}
                        defaultValue={this.state.themeLight}
                        value={this.state.themeLight}
                        onSelectChange={e => {
                          this.updateSetting('theme:light', e.target?.value, 'themeLight')
                        }}
                      />
                    }
                  />
                </ZoneBox>
                <ZoneBox>
                  <SettingSubItem
                    title={'Dark Theme'}
                    subtitle={'Dark theme to display'}
                    component={
                      <SingleSelect
                        width='60%'
                        showTextbox={false}
                        items={[
                          { text: 'Light (Default)', value: 'light' },
                          { text: 'Dark', value: 'dark' },
                          { text: 'Noctis', value: 'noctis' },
                          { text: 'Blue Jean', value: 'bluejean' },
                          { text: 'Midnight', value: 'midnight' },
                          { text: 'Moonlight', value: 'moonlight' },
                          { text: 'Purple Rain', value: 'purplerain' },
                          { text: 'Sandstone', value: 'sandstone' },
                          { text: "Winter's Fire", value: 'winterfire' }
                        ]}
                        defaultValue={this.state.themeDark}
                        value={this.state.themeDark}
                        onSelectChange={e => {
                          this.updateSetting('theme:dark', e.target?.value, 'themeDark')
                        }}
                      />
                    }
                  />
                </ZoneBox>
              </Zone>
            </SettingItem>

            <SettingItem
              title='Color Scheme'
              subtitle='Select the colors for your color scheme.'
              component={
                <Button
                  text={'Save'}
                  flat={true}
                  style={'success'}
                  extraClass={'uk-float-right mt-10'}
                  onClick={() => {
                    this.saveColorScheme()
                  }}
                />
              }
            >
              <Zone>
                <ZoneBox>
                  <SettingSubItem
                    title='Built-in Color Scheme'
                    subtitle='Select a predefined color scheme'
                    component={
                      <SingleSelect
                        width='60%'
                        showTextbox={false}
                        items={[
                          { text: 'Light (Default)', value: 'light' },
                          { text: 'Dark', value: 'dark' },
                          { text: 'Noctis', value: 'noctis' },
                          { text: 'Blue Jean', value: 'bluejean' },
                          { text: 'Midnight', value: 'midnight' },
                          { text: 'Moonlight', value: 'moonlight' },
                          { text: 'Purple Rain', value: 'purplerain' },
                          { text: 'Sandstone', value: 'sandstone' },
                          { text: "Winter's Fire", value: 'winterfire' }
                        ]}
                        defaultValue={this.state.selectedColorScheme}
                        value={this.state.selectedColorScheme}
                        onSelectChange={e => {
                          this.onBuiltInColorSelectChange(e)
                        }}
                      />
                    }
                  />
                </ZoneBox>
                <ZoneBox>
                  <SettingSubItem
                    title='Header Background'
                    subtitle='Background color of the header'
                    component={
                      <ColorSelector
                        ref={cs => {
                          this.headerBGColorSelect = cs
                        }}
                        defaultColor={this.getSettingsValue('colorHeaderBG')}
                        parentClass={'uk-width-2-3 uk-float-right'}
                      />
                    }
                  />
                </ZoneBox>
                <ZoneBox>
                  <SettingSubItem
                    title='Header Primary'
                    subtitle='Text and icon color within the header'
                    component={
                      <ColorSelector
                        ref={cs => {
                          this.headerPrimaryColorSelect = cs
                        }}
                        defaultColor={this.getSettingsValue('colorHeaderPrimary')}
                        parentClass={'uk-width-2-3 uk-float-right'}
                      />
                    }
                  />
                </ZoneBox>
                <ZoneBox>
                  <SettingSubItem
                    title='Primary'
                    subtitle='Most text and icons'
                    component={
                      <ColorSelector
                        ref={cs => {
                          this.primaryColorSelect = cs
                        }}
                        defaultColor={this.getSettingsValue('colorPrimary')}
                        parentClass={'uk-width-2-3 uk-float-right'}
                      />
                    }
                  />
                </ZoneBox>
                <ZoneBox>
                  <SettingSubItem
                    title='Secondary'
                    subtitle='The main background color'
                    component={
                      <ColorSelector
                        ref={cs => {
                          this.secondaryColorSelect = cs
                        }}
                        defaultColor={this.getSettingsValue('colorSecondary')}
                        parentClass={'uk-width-2-3 uk-float-right'}
                      />
                    }
                  />
                </ZoneBox>
                <ZoneBox>
                  <SettingSubItem
                    title='Tertiary'
                    subtitle='Accent color, used for links, some buttons, and notifications'
                    component={
                      <ColorSelector
                        ref={cs => {
                          this.tertiaryColorSelect = cs
                        }}
                        defaultColor={this.getSettingsValue('colorTertiary')}
                        parentClass={'uk-width-2-3 uk-float-right'}
                      />
                    }
                  />
                </ZoneBox>
                <ZoneBox>
                  <SettingSubItem
                    title='Quaternary'
                    subtitle='Sidebar background color'
                    component={
                      <ColorSelector
                        ref={cs => {
                          this.quaternaryColorSelect = cs
                        }}
                        defaultColor={this.getSettingsValue('colorQuaternary')}
                        parentClass={'uk-width-2-3 uk-float-right'}
                      />
                    }
                  />
                </ZoneBox>
              </Zone>
            </SettingItem>
          </div>
        </div>
      </div>
    )
  }
}

SettingsColorSchemes.propTypes = {
  fetchSettings: PropTypes.func.isRequired,
  updateSetting: PropTypes.func.isRequired,
  updateColorScheme: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  settings: state.settings.settings
})

export default connect(mapStateToProps, { fetchSettings, updateSetting, updateColorScheme })(SettingsColorSchemes)
