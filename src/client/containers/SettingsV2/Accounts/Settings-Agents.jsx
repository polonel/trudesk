import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchSettings, updateSetting } from 'actions/settings'
import PageTitle from 'components/PageTitle'
import Breadcrumbs from 'components/Breadcrumbs'
import moment from 'moment-timezone'
import TitleContext from 'app/TitleContext'
import { Helmet } from 'react-helmet-async'
import TruCard from 'components/TruCard'
import Table from 'components/Table'
import TableRow from 'components/Table/TableRow'
import TableCell from 'components/Table/TableCell'
import TableHeader from 'components/Table/TableHeader'
import Avatar from 'components/Avatar/Avatar'
import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import Button from 'components/Button'
import ButtonGroup from 'components/ButtonGroup'
import TruTabWrapper from 'components/TruTabs/TruTabWrapper'
import TruTabSelectors from 'components/TruTabs/TruTabSelectors'
import TruTabSelector from 'components/TruTabs/TruTabSelector'
import TruTabSection from 'components/TruTabs/TruTabSection'

class SettingsAgents extends React.Component {
  componentDidMount () {
    this.props.fetchAccounts({ page: 0, limit: 10000, type: 'agents', showDeleted: false })
  }

  getSettingsValue (name) {
    return this.props.settings.getIn(['settings', name, 'value'])
      ? this.props.settings.getIn(['settings', name, 'value'])
      : ''
  }

  updateSetting (stateName, name, value) {
    this.props.updateSetting({ stateName, name, value })
  }

  componentWillUnmount () {
    this.props.unloadAccounts()
  }

  getTimezones () {
    return moment.tz
      .names()
      .map(function (name) {
        const year = new Date().getUTCFullYear()
        const timezoneAtBeginningOfyear = moment.tz(year + '-01-01', name)
        return {
          utc: timezoneAtBeginningOfyear.utcOffset(),
          text: '(GMT' + timezoneAtBeginningOfyear.format('Z') + ') ' + name,
          value: name
        }
      })
      .sort(function (a, b) {
        return a.utc - b.utc
      })
  }

  onTimezoneChange (e) {
    if (e.target.value) this.updateSetting('timezone', 'gen:timezone', e.target.value)
  }

  render () {
    const AgentRow = (
      <>
        {this.props.accountsState.accounts &&
          this.props.accountsState.accounts.map(account => {
            const lastActive = moment(account.get('lastOnline')).fromNow()
            return (
              <TableRow key={account.get('_id')} clickable={false} className={'vam'}>
                <TableCell className={'vam'} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      showAsNameInitials={!account.get('image')}
                      image={account.get('image') || null}
                      showAsNameInitialsName={account.get('fullname')}
                      showOnlineBubble={false}
                      size={35}
                      style={{ marginRight: 10 }}
                    />
                    <div>
                      <a href={'#'}>{account.get('fullname')}</a>
                      <span style={{ display: 'block', fontSize: '11px', marginTop: 1 }}>{account.get('title')}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={'vam'}>{account.get('email')}</TableCell>
                <TableCell className={'vam'}>{lastActive}</TableCell>
                <TableCell className={'vam'}>
                  <ButtonGroup>
                    <Button icon={'edit'} small={true} extraClass={'hover-primary'} />
                    <Button icon={'content_copy'} small={true} extraClass={'hover-primary'} />
                  </ButtonGroup>
                </TableCell>
              </TableRow>
            )
          })}
      </>
    )

    const AgentTable = (
      <Table
        extraClass={'pDataTable'}
        stickyHeader={true}
        striped={false}
        style={{ borderBottom: 0, marginBottom: 0 }}
        headers={[
          <TableHeader key={1} width={150} height={50} text={'Name'} padding={'0px 15px'} />,
          <TableHeader key={2} width={150} height={50} text={'Email'} padding={'0px 15px'} />,
          <TableHeader key={3} width={100} height={50} text={'Last Active'} padding={'0px 15px'} />,
          <TableHeader key={4} width={50} height={50} text={' '} padding={'0px 15px'} />
        ]}
      >
        {AgentRow}
      </Table>
    )

    return (
      <div>
        <TitleContext.Consumer>
          {({ title }) => (
            <Helmet>
              <title>{title} Agents</title>
            </Helmet>
          )}
        </TitleContext.Consumer>
        <PageTitle
          breadcrumbs={
            <Breadcrumbs
              links={[
                { url: '/v2settings', title: 'Settings' },
                { url: '/v2settings#accounts', title: 'Account Management' },
                { url: '/v2settings/agents', title: 'Agents', active: true }
              ]}
              classes={['uk-width-1-1']}
            />
          }
          rightComponent={
            <div
              style={{
                minWidth: 200,
                maxWidth: 300,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <Button text={'New Agent'} style={'primary'} />
            </div>
          }
        />
        <div style={{ display: 'flex', height: '100vh' }}>
          <div style={{ flexGrow: 1, padding: 15, width: '100%' }}>
            <TruTabWrapper>
              <TruTabSelectors showTrack={true}>
                <TruTabSelector
                  selectorId={0}
                  label={'Active'}
                  active={true}
                  showBadge={true}
                  badgeText={this.props.accountsState.accounts?.size}
                />
                <TruTabSelector selectorId={1} label={'Deactivated'} showBadge={true} badgeText={0} />
              </TruTabSelectors>
              <TruTabSection sectionId={0} active={true}>
                <TruCard
                  loaderActive={this.props.accountsState.loading}
                  content={AgentTable}
                  fullSize={false}
                  hover={false}
                  extraContentClass={'nopadding'}
                />
              </TruTabSection>
              <TruTabSection sectionId={1}>123</TruTabSection>
            </TruTabWrapper>
          </div>
          <div className={'info-sidebar'}>
            <h3>Agents</h3>
            <p>
              This list shows the list of agents in your service desk. You can edit an agent or create a new one by
              clicking the <strong>New Agent</strong> button.
            </p>
          </div>
        </div>
      </div>
    )
  }
}

SettingsAgents.propTypes = {
  fetchSettings: PropTypes.func.isRequired,
  updateSetting: PropTypes.func.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  accountsState: PropTypes.object.isRequired,
  sessionUser: PropTypes.object
}

const mapStateToProps = state => ({
  settings: state.settings.settings,
  accountsState: state.accountsState,
  sessionUser: state.shared.sessionUser
})

export default connect(mapStateToProps, { fetchAccounts, unloadAccounts, fetchSettings, updateSetting })(SettingsAgents)
