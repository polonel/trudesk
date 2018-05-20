import React from 'react';
import SidebarItem from "../SidebarItem/index.jsx";
import NavSeperator from '../NavSeperator/index.jsx';
import Submenu from '../Submenu/index.jsx';
import SubmenuItem from '../SubmenuItem/index.jsx';

import Permissions from '../../../../permissions/index.js';

import Helpers from 'modules/helpers'

class Sidebar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeItem: '',
            activeSubItem: '',
            sessionUser: null,

            plugins: null
        };
    }

    componentWillMount() {
        global.react.updateSidebar = (data) => {
            this.setState(data);
        };
    }

    componentDidMount() {
        Helpers.UI.getPlugins((err, result) => {
            if (!err && result.plugins) {
                this.setState({plugins: result.plugins});
            }
        });
    }

    componentDidUpdate() {
        Helpers.UI.initSidebar();
        Helpers.UI.bindExpand();
    }

    renderPlugins() {
        const { plugins, sessionUser, activeItem, activeSubItem } = this.state;
        return (
            <SidebarItem
                text="Plugins"
                icon="extension"
                href="/plugins"
                class="navPlugins tether-plugins"
                hasSubmenu={plugins && plugins.length > 0}
                subMenuTarget="plugins"
                active={(activeItem === 'plugins')}
            >
                {plugins && plugins.length > 0 &&
                    <Submenu id='plugins' subMenuOpen={(activeItem === 'plugins')}>
                        {plugins.map(function(item) {
                            const perms = item.permissions.split(' ');
                            if (perms.indexOf(sessionUser.role) === -1)
                                return;
                            return (
                                <SubmenuItem
                                    key={item.name}
                                    text={item.menu.main.name}
                                    icon={item.menu.main.icon}
                                    href={item.menu.main.link}
                                    active={activeSubItem === item.name}
                                />
                            )
                        })}
                    </Submenu>
                }
            </SidebarItem>
        )
    }

    render() {
        const { activeItem, activeSubItem, plugins, sessionUser } = this.state;
        return (
            <ul className="side-nav">
                <SidebarItem text="Dashboard" icon="dashboard" href="/dashboard" class="navHome" active={(activeItem === 'dashboard')} />
                <SidebarItem text="Tickets" icon="assignment" href="/tickets" class="navTickets no-ajaxy" hasSubmenu={true} subMenuTarget='tickets' active={(activeItem === 'tickets')}>
                    <Submenu id="tickets">
                        <SubmenuItem text="Active" icon="timer" href="/tickets/active" active={activeSubItem === 'tickets-active'} />
                        <SubmenuItem text="Assigned" icon="assignment_ind" href="/tickets/assigned" active={activeSubItem === 'tickets-assigned'} />
                        <NavSeperator />
                        <SubmenuItem text="New" icon="&#xE24D;" href="/tickets/new" active={activeSubItem === 'tickets-new'} />
                        <SubmenuItem text="Pending" icon="&#xE629;" href="/tickets/pending" active={activeSubItem === 'tickets-pending'} />
                        <SubmenuItem text="Open" icon="&#xE2C8;" href="/tickets/open" active={activeSubItem === 'tickets-open'} />
                        <SubmenuItem text="Closed" icon="&#xE2C7;" href="/tickets/closed" active={activeSubItem === 'tickets-closed'} />
                    </Submenu>
                </SidebarItem>
                <SidebarItem text="Messages" icon="chat" href="/messages" class="navMessages" active={(activeItem === 'messages')} />
                <SidebarItem text="Accounts" icon="&#xE7FD;" href="/accounts" class="navAccounts" active={(activeItem === 'accounts')} />
                <SidebarItem text="Groups" icon="supervisor_account" href="/groups" class="navGroups" active={(activeItem === 'groups')} />
                <SidebarItem text="Reports" icon="assessment" href="/reports/generate" class="navReports no-ajaxy" hasSubmenu={true} subMenuTarget='reports' active={(activeItem === 'reports')} >
                    <Submenu id="reports">
                        <SubmenuItem text="Generate" icon="timeline" href="/reports/generate" active={activeSubItem === 'reports-generate'} />
                        <NavSeperator/>
                        <SubmenuItem text="Group Breakdown" icon="supervisor_account" href="/reports/breakdown/group" active={activeSubItem === 'reports-breakdown-group'} />
                        <SubmenuItem text="User Breakdown" icon="perm_identity" href="/reports/breakdown/user" active={activeSubItem === 'reports-breakdown-user'} />
                    </Submenu>
                </SidebarItem>

                {this.renderPlugins()}

                <SidebarItem text="Notices" icon="warning" href="/notices" class="navNotices" active={(activeItem === 'notices')} />
                <NavSeperator/>
                <SidebarItem text="Settings" icon="settings" href="/settings" class="navSettings no-ajaxy" hasSubmenu={true} subMenuTarget='settings' active={(activeItem === 'settings')}>
                    <Submenu id="settings">
                        <SubmenuItem text="General" icon="tune" href="/settings" active={activeSubItem === 'settings-general'} />
                        <SubmenuItem text="Legal" icon="gavel" href="/settings/legal" active={activeSubItem === 'settings-legal'} />
                        <NavSeperator/>
                        <SubmenuItem text="Tags" icon="style" href="/settings/tags" active={activeSubItem === 'settings-tags'}/>
                        <SubmenuItem text="Ticket Types" icon="text_fields" href="/settings/tickettypes" active={activeSubItem === 'settings-tickettypes'}/>

                        {sessionUser && Permissions.canThis(sessionUser.role, 'settings:logs') &&
                            <SubmenuItem text="Logs" icon="remove_from_queue" href="/settings/logs" hasSeperator={true} active={activeSubItem === 'settings-logs'} />
                        }

                    </Submenu>
                </SidebarItem>
                <SidebarItem href="/about" icon="help" text="About" active={(activeItem === 'about')} />
            </ul>
        )
    }
}

export default Sidebar;