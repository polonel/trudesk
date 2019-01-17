import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment-timezone';
import { fetchSettings } from 'actions/settings';

import SettingItem from 'components/Settings/SettingItem';

import InputWithSave from 'components/Settings/InputWithSave';
import SingleSelect from 'components/Settings/SingleSelect';

class GeneralSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            viewData: window.trudesk.viewdata
        };
    }

    componentDidMount() {
        this.props.fetchSettings();
    }

    getSettingsValue(name) {
        return ((this.props.settings.getIn(['settings', name, 'value'])) ? this.props.settings.getIn(['settings', name, 'value']) : '' );
    }

    getTimezones() {
        return moment.tz.names().map(function(name) {
            const year = new Date().getUTCFullYear();
            const timezoneAtBeginningOfyear = moment.tz(year + '-01-01', name);
            return {
                utc: timezoneAtBeginningOfyear.utcOffset(),
                label: '(GMT' + timezoneAtBeginningOfyear.format('Z') + ') ' + name,
                value: name
            };
        }).sort(function(a, b) { return a.utc - b.utc; });
    }

    render() {
        const { active } = this.props;

        const SiteTitle = (
            <InputWithSave stateName='siteTitle' settingName='gen:sitetitle' value={this.getSettingsValue('siteTitle')} />
        );

        const SiteUrl = (
            <InputWithSave stateName='siteUrl' settingName='gen:siteurl' value={this.getSettingsValue('siteUrl')} />
        );

        let Timezone = (
            <SingleSelect stateName='timezone' settingName='gen:timezone' items={this.getTimezones()} value={this.getSettingsValue('timezone')} />
        );

        return (
            <div data-settings-id="settings-general" className={((active) ? 'active': '')}>
                <SettingItem title='Site Title' subTitle={<div>Title of site. Used as page title. <i>default: Trudesk</i></div>} component={SiteTitle} />
                <SettingItem title='Site Url' subTitle={<div>Publicly accessible URL of this site. <i>ex: {this.state.viewData.hosturl}</i></div>} component={SiteUrl} />
                <SettingItem title='Time Zone' subTitle='Set the local timezone for date display' tooltip='Requires Server Restart' component={Timezone} />
            </div>
        );
    }
}

GeneralSettings.propTypes = {
    active: PropTypes.bool,
    fetchSettings: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
    settings: state.settings.settings
});

export default connect(mapStateToProps, { fetchSettings })(GeneralSettings);