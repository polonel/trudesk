import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import BottomNav from './components/BottomNav'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import ThemeSync from './components/ThemeSync'
import LoginScreen from './screens/LoginScreen'
import TicketListScreen from './screens/TicketListScreen'
import TicketDetailScreen from './screens/TicketDetailScreen'
import CreateTicketScreen from './screens/CreateTicketScreen'
import MessagesScreen from './screens/MessagesScreen'
import ChatScreen from './screens/ChatScreen'
import ProfileScreen from './screens/ProfileScreen'

function AppShell() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 pt-[env(safe-area-inset-top)]">
      <ThemeSync />
      <OfflineBanner />
      <div className="flex-1 overflow-hidden relative">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
      <BottomNav />
    </div>
  )
}

const router = createBrowserRouter(
  [
    { path: 'login', element: <><ThemeSync /><LoginScreen /></> },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <TicketListScreen /> },
        { path: 'tickets/new', element: <CreateTicketScreen /> },
        { path: 'tickets/:uid', element: <TicketDetailScreen /> },
        { path: 'messages', element: <MessagesScreen /> },
        { path: 'messages/:id', element: <ChatScreen /> },
        { path: 'profile', element: <ProfileScreen /> },
      ],
    },
  ],
  { basename: '/mobile' }
)

export default function App() {
  return <RouterProvider router={router} />
}
