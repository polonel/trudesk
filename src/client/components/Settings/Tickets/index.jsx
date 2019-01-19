import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import SettingItem from 'components/Settings/subcomponents/SettingItem';
import SingleSelect from 'components/Settings/subcomponents/SingleSelect';

import { updateSetting } from 'actions/settings';
import EnableSwitch from 'components/Settings/subcomponents/EnableSwitch';
import NumberWithSave from 'components/Settings/subcomponents/NumberWithSave';

class TicketsSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            viewData: window.trudesk.viewdata
        };
    }

    getSetting(name) {
        return ((this.props.settings.getIn(['settings', name, 'value'])) ? this.props.settings.getIn(['settings', name, 'value']) : '' );
    }

    getTicketTypes() {
        return ((this.props.settings && this.props.settings.get('ticketTypes')) ? this.props.settings.get('ticketTypes').toArray() : []);
    }

    onDefaultTicketTypeChange(e) {
        this.props.updateSetting({name: 'ticket:type:default', value: e.target.value, stateName: 'defaultTicketType'});
    }

    onAllowPublicTicketsChange(e) {
        this.props.updateSetting({name: 'allowPublicTickets:enable', value: e.target.checked, stateName: 'allowPublicTickets'});
    }

    onShowOverdueChange(e) {
        this.props.updateSetting({name: 'showOverdueTickets:enable', value: e.target.checked, stateName: 'showOverdueTickets'});
    }

    render() {
        const { active } = this.props;
        const { viewData } = this.state;
        const mappedTypes = this.getTicketTypes().map(function(type) {
            return {text: type.get('name'), value: type.get('_id') };
        });

        return (
            <div className={((active) ? 'active': 'hide')}>
                <SettingItem title={'Default Ticket Type'} subTitle={'Default ticket type for newly created tickets.'}
                             component={
                                 <SingleSelect items={mappedTypes} value={this.getSetting('defaultTicketType')} onSelectChange={(e) => { this.onDefaultTicketTypeChange(e); }} width={'50%'} />
                             }/>
                <SettingItem title={'Allow Public Tickets'}
                             subTitle={<div>Allow the creation of tickets by users that are unregistered. (<a href={viewData.hosturl + '/newissue'}>{viewData.hosturl + '/newissue'}</a>)</div>}
                             component={
                                 <EnableSwitch stateName={'allowPublicTickets'} label={'Enable'} checked={this.getSetting('allowPublicTickets')} onChange={(e) => { this.onAllowPublicTicketsChange(e); }} />
                             }
                />
                <SettingItem title={'Show Overdue Tickets'} subTitle={'Enable/Disable flashing of tickets based on SLA time of type priority.'}
                             tooltip={'If disabled, priority SLA times will not mark tickets overdue.'} 
                             component={
                                 <EnableSwitch stateName={'showOverdueTickets'} label={'Enable'} checked={this.getSetting('showOverdueTickets')} onChange={(e) => { this.onShowOverdueChange(e); }}/>
                             }/>
                 <SettingItem title={'Minimum Subject Length'} subTitle={'Minimum character limit for ticket subject'}
                              component={
                                  <NumberWithSave stateName={'minSubjectLength'} settingName={'ticket:minlength:subject'} value={this.getSetting('minSubjectLength')} width={'40%'} />
                              }/>
                <SettingItem title={'Minimum Issue Length'} subTitle={'Minimum character limit for ticket issue'}
                             component={
                                 <NumberWithSave stateName={'minIssueLength'} settingName={'ticket:minlength:issue'} value={this.getSetting('minIssueLength')} width={'40%'} />
                             }/>
            </div>
        );
    }
}

TicketsSettings.propTypes = {
    active: PropTypes.bool.isRequired,
    settings: PropTypes.object.isRequired,
    updateSetting: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
   settings: state.settings.settings
});

export default connect(mapStateToProps, { updateSetting })(TicketsSettings);