import { NavLink } from 'react-router-dom'
import {
  TicketIcon,
  PlusCircleIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

const tabs = [
  { to: '/', label: 'Tickets', Icon: TicketIcon, end: true },
  { to: '/tickets/new', label: 'Create', Icon: PlusCircleIcon, end: false },
  { to: '/messages', label: 'Messages', Icon: ChatBubbleLeftRightIcon, end: false },
  { to: '/profile', label: 'Profile', Icon: UserCircleIcon, end: false },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <Icon className="w-6 h-6 mb-0.5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
