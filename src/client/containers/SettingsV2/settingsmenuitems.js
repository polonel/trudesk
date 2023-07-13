export default [
  {
    title: 'General Settings',
    subtitle: 'Manage general settings for your instance of trudesk',
    items: [
      {
        title: 'Time & Date',
        description: 'Set time and date information for your service desk',
        url: '/v2settings/timeanddate',
        iconPackage: 'Fi',
        icon: 'Clock',
        iconClass: 'c12'
      },
      {
        title: 'Rebranding',
        description: 'Customize the agent portal to your branding needs.',
        url: '/v2settings/rebranding',
        iconPackage: 'Md',
        icon: 'OutlineScreenshotMonitor',
        iconClass: 'c13',
        betaBadge: true
      },
      {
        title: 'Color Schemes',
        description: 'Create a customized color scheme or select a built-in scheme for your instance.',
        url: '/v2settings/colorschemes',
        iconPackage: 'Ai',
        icon: 'TwotoneExperiment',
        iconClass: 'c14'
      },
      {
        title: 'Legal',
        description: 'Customize your service desk privacy policy and terms of service',
        url: '/v2settings/legal',
        iconPackage: 'Bi',
        icon: 'Book',
        iconClass: 'c103-legal'
      },
      {
        title: 'Email',
        header: true
      },
      {
        title: 'Mailer',
        description: 'Configure SMTP settings for sending notification emails.',
        url: '/v2settings/mailer',
        iconPackage: 'Tb',
        icon: 'MailCog',
        iconClass: 'c20'
      },
      {
        title: 'Incoming Mail Check',
        description: 'Configure IMAP mailbox settings for processing incoming service requests.',
        url: '/v2settings/mailer',
        iconPackage: 'Tb',
        icon: 'MailCheck',
        iconClass: 'c21'
      },
      {
        title: 'Notification Templates',
        description: 'Customize templates used for email notifications',
        url: '/v2settings/mailer',
        iconPackage: 'Tb',
        icon: 'MailBolt',
        iconClass: 'c22',
        betaBadge: true
      }
    ]
  },
  {
    title: 'Account Management',
    subtitle: 'Manage account settings for your instance of trudesk',
    items: [
      {
        title: 'Agents',
        description: 'Manage all agents and their account and security details',
        url: '/v2settings/mailer',
        iconPackage: 'Tb',
        icon: 'UserShield',
        iconClass: 'c15'
      },
      {
        title: 'Role & Permissions',
        description: 'Create and modify roles and permissions for your agents and requesters',
        url: '/v2settings/mailer',
        iconPackage: 'Tb',
        icon: 'LockCheck',
        iconClass: 'c16'
      },
      {
        title: 'Departments',
        description: 'Manage departments to assign to your agent teams and requester groups',
        url: '/v2settings/mailer',
        iconPackage: 'Bs',
        icon: 'BuildingUp',
        iconClass: 'c17'
      },
      {
        title: 'Teams',
        description: 'Manage agent teams and their associated members',
        url: '/v2settings/mailer',
        iconPackage: 'Bi',
        icon: 'Group',
        iconClass: 'c18'
      },
      {
        title: 'Requesters',
        description: 'Manage requesters and their account details',
        url: '/v2settings/mailer',
        specialIcon: 'requesters'
      },
      {
        title: 'Security Settings',
        description: 'Manage general account security settings',
        url: '/v2settings/mailer',
        iconPackage: 'Bs',
        icon: 'ShieldCheck',
        iconClass: 'c19'
      }
    ]
  },
  {
    title: 'Ticket Management',
    subtitle: 'Manage ticket settings for your instance of trudesk',
    items: [
      {
        title: 'Ticket Settings',
        description: 'Testing this thing out.. Testing this thing out..',
        url: '/v2settings/tickets',
        iconPackage: 'Fi',
        icon: 'FileText',
        iconClass: 'c11'
      },
      {
        title: 'Ticket Types',
        description: 'Create custom ticket types for your service desk',
        url: '/v2settings/tickets',
        iconPackage: 'Lu',
        icon: 'FileType',
        iconClass: 'c104-tickettype'
      }
    ]
  },
  {
    title: 'Server Management',
    subtitle: 'Manage account settings for your instance of trudesk',
    items: [
      {
        title: 'Instance Management',
        description: 'Testing this description out.. Testing this description out..',
        url: '/v2settings/mailer',
        iconPackage: 'Tb',
        icon: 'Server2',
        iconClass: 'c100-server'
      },
      {
        title: 'Elasticsearch',
        description: 'Manage Elasticsearch configuration and index',
        url: '/v2settings/mailer',
        iconPackage: 'Cg',
        icon: 'SearchLoading',
        iconClass: 'c101-es',
        betaBadge: true
      },
      {
        title: 'Backup & Restore',
        description: 'Manage trudesk backups. Download previous backups or initiate a restore',
        url: '/v2settings/mailer',
        iconPackage: 'Lu',
        icon: 'DatabaseBackup',
        iconClass: 'c102-bkup'
      }
    ]
  }
]
