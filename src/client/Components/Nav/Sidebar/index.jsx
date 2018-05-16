import React from 'react';
import NavButton from "../NavButton/index.jsx";
import NavSeperator from '../NavSeperator/index.jsx';
import Submenu from '../Submenu/index.jsx';
import SubmenuItem from '../SubmenuItem/index.jsx';

import Permissions from '../../../../permissions/index.js';

class Sidebar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeItem: '',
            activeSubItem: '',
            sessionUser: null
        };
    }

    componentWillMount() {
        global.react.updateSidebar = (data) => {
            this.setState(data);
        };
    }

    render() {
        return (
            <ul className="side-nav">
                <NavButton text="Dashboard" icon="dashboard" href="/dashboard" class="navHome" active={(this.state.activeItem === 'dashboard')} />
                <NavButton text="Tickets" icon="assignment" href="/tickets" class="navTickets no-ajaxy" hasSubmenu={true} subMenuTarget='tickets' active={(this.state.activeItem === 'tickets')}>
                    <Submenu id="tickets">
                        <SubmenuItem text="Active" icon="timer" href="/tickets/active" active={this.state.activeSubItem === 'tickets-active'} />
                        <SubmenuItem text="Assigned" icon="assignment_ind" href="/tickets/assigned" active={this.state.activeSubItem === 'tickets-assigned'} />
                        <NavSeperator />
                        <SubmenuItem text="New" icon="&#xE24D;" href="/tickets/new" active={this.state.activeSubItem === 'tickets-new'} />
                        <SubmenuItem text="Pending" icon="&#xE629;" href="/tickets/pending" active={this.state.activeSubItem === 'tickets-pending'} />
                        <SubmenuItem text="Open" icon="&#xE2C8;" href="/tickets/open" active={this.state.activeSubItem === 'tickets-open'} />
                        <SubmenuItem text="Closed" icon="&#xE2C7;" href="/tickets/closed" active={this.state.activeSubItem === 'tickets-closed'} />
                    </Submenu>
                </NavButton>
                <NavButton text="Messages" icon="chat" href="/messages" class="navMessages" active={(this.state.activeItem === 'messages')} />
                <NavButton text="Accounts" icon="&#xE7FD;" href="/accounts" class="navAccounts" active={(this.state.activeItem === 'accounts')} />
                <NavButton text="Groups" icon="supervisor_account" href="/groups" class="navGroups" active={(this.state.activeItem === 'groups')} />
                <NavButton text="Reports" icon="chat" href="/reports/generate" class="navReports" active={(this.state.activeItem === 'reports')} />
                <NavButton text="Plugins" icon="select_all" href="/plugins" class="navPlugins" active={(this.state.activeItem === 'plugins')} />
                <NavButton text="Notices" icon="warning" href="/notices" class="navNotices" active={(this.state.activeItem === 'notices')} />
                <NavSeperator/>
                <NavButton text="Settings" icon="settings" href="/settings" class="navSettings no-ajaxy" hasSubmenu={true} subMenuTarget='settings' active={(this.state.activeItem === 'settings')}>
                    <Submenu id="settings">
                        <SubmenuItem text="General" icon="tune" href="/settings" active={this.state.activeSubItem === 'settings-general'} />
                        <SubmenuItem text="Legal" icon="gavel" href="/settings/legal" active={this.state.activeSubItem === 'settings-legal'} />
                        <NavSeperator/>
                        <SubmenuItem text="Tags" icon="style" href="/settings/tags" active={this.state.activeSubItem === 'settings-tags'}/>
                        <SubmenuItem text="Ticket Types" icon="text_fields" href="/settings/tickettypes" active={this.state.activeSubItem === 'settings-tickettypes'}/>

                        {this.state.sessionUser && Permissions.canThis(this.state.sessionUser.role, 'settings:logs') &&
                            <SubmenuItem text="Logs" icon="remove_from_queue" href="/settings/logs" hasSeperator={true} active={this.state.activeSubItem === 'settings-logs'} />
                        }

                    </Submenu>
                </NavButton>
                <NavButton href="/about" icon="help" text="About" active={(this.state.activeItem === 'about')} />
            </ul>
        )
    }
}

export default Sidebar;