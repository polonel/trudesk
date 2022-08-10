/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/28/19 8:04 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

export const menu = [
  {
    icon: 'dashboard',
    label: 'Dashboard',
    url: '/dashboard',
    perm: 'agent:*'
  },
  {
    icon: 'assignment',
    label: 'Tickets',
    url: '/tickets',
    perm: 'tickets:view',
    showTitle: true,
    options: [
      {
        label: 'Active',
        icon: 'timer',
        url: '/tickets/active'
      },
      {
        label: 'Assigned',
        icon: 'assignment_ind',
        url: '/tickets/assigned'
      },
      {
        divider: true
      },
      {
        label: 'New',
        icon: 'description',
        url: '/tickets/new'
      },
      {
        label: 'Pending',
        icon: 'sync_problem',
        url: '/tickets/pending'
      },
      {
        label: 'Open',
        icon: 'folder_open',
        url: '/tickets/open'
      },
      {
        label: 'Closed',
        icon: 'folder',
        url: '/tickets/closed'
      }
    ]
  },
  {
    label: 'Chat Sessions',
    icon: 'chat',
    url: '/chat'
  },
  {
    label: 'Knowledge Base',
    icon: 'book',
    url: '/kbadmin',
    perm: 'agent:*'
  },
  {
    label: 'Knowledge Base',
    icon: 'book',
    url: '/portal',
    customer: true
  },
  {
    label: 'Accounts',
    icon: 'person',
    url: '/accounts',
    perm: 'accounts:view',
    options: [
      {
        label: 'Customers',
        icon: 'person_outline',
        url: '/accounts/customers'
      },
      {
        label: 'Agents',
        icon: 'person_outline',
        url: '/accounts/agents',
        perm: 'agent:*'
      },
      {
        label: 'Admins',
        icon: 'how_to_reg',
        url: '/accounts/admins',
        perm: 'admin:*'
      }
    ]
  },
  {
    label: 'Organizations',
    icon: 'domain',
    url: '/organizations',
    perm: 'organizations:view'
  },
  {
    label: 'Teams',
    icon: 'wc',
    url: '/teams',
    perm: 'admin:*'
  },
  {
    label: 'Departments',
    icon: 'domain',
    url: '/departments',
    perm: 'admin:*'
  },
  // {
  //   label: 'Reports',
  //   icon: 'assessment',
  //   url: '/reports/generate',
  //   perm: 'reports:create'
  // },
  {
    divider: true
  },
  {
    label: 'Cloud Management',
    icon: 'cloud',
    url: '/cloud',
    cloud: 'owner|billing'
  },
  {
    label: 'Settings',
    showTitle: false,
    icon: 'settings',
    url: '/settings',
    perm: 'admin:*',
    options: [
      {
        label: 'General',
        icon: 'settings',
        url: '/settings/general',
        perm: 'admin:*'
      },
      {
        label: 'Accounts',
        icon: 'settings',
        url: '/settings/accounts',
        perm: 'admin:*'
      },
      {
        label: 'Appearance',
        icon: 'settings',
        url: '/settings/appearance',
        perm: 'admin:*'
      },
      {
        label: 'Permissions',
        icon: 'settings',
        url: '/settings/permissions',
        perm: 'admin:*'
      },
      {
        label: 'Tickets',
        icon: 'settings',
        url: '/settings/tickets',
        perm: 'admin:*'
      },
      {
        label: 'Mailer',
        icon: 'settings',
        url: '/settings/mailer',
        perm: 'admin:*'
      },
      {
        label: 'Elasticsearch',
        icon: 'settings',
        url: '/settings/elasticsearch',
        perm: 'admin:*'
      },
      {
        label: 'Backup/Restore',
        icon: 'settings',
        url: '/settings/backup',
        perm: 'admin:*'
      },
      {
        label: 'Server',
        icon: 'settings',
        url: '/settings/server',
        perm: 'admin:*'
      },
      {
        label: 'Legal',
        icon: 'settings',
        url: '/settings/legal',
        perm: 'admin:*'
      }
    ]
  },
  // {
  //   label: 'Update',
  //   icon: 'update',
  //   url: '/update',
  //   perm: 'admin:*'
  // },
  {
    label: 'About',
    icon: 'help',
    url: '/about'
  }
]
