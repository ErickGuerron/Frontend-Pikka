import type { RouteObject } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth, RequireSection } from '@/features/auth/guards'
import { DriversPage } from '@/features/drivers/DriversPage'
import { ExceptionsPage } from '@/features/exceptions/ExceptionsPage'
import { LandingPage } from '@/features/landing/LandingPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { RoutesPage } from '@/features/routing/RoutesPage'
import { AppLayout } from '@/features/shell/AppLayout'
import { TrackingPage } from '@/features/tracking/TrackingPage'
import { CreateUserPage } from '@/features/users/CreateUserPage'
import { UsersPage } from '@/features/users/UsersPage'
import { ZonesPage } from '@/features/zones/ZonesPage'
import { HomeRoute } from './HomeRoute'
import { NotFoundPage } from './NotFoundPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/inicio', element: <LandingPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomeRoute /> },
      { path: 'orders', element: <RequireSection section="orders"><OrdersPage /></RequireSection> },
      { path: 'exceptions', element: <RequireSection section="exceptions"><ExceptionsPage /></RequireSection> },
      { path: 'zones', element: <RequireSection section="zones"><ZonesPage /></RequireSection> },
      { path: 'routes', element: <RequireSection section="routes"><RoutesPage /></RequireSection> },
      { path: 'drivers', element: <RequireSection section="drivers"><DriversPage /></RequireSection> },
      { path: 'tracking', element: <RequireSection section="tracking"><TrackingPage /></RequireSection> },
      { path: 'users', element: <RequireSection section="users"><UsersPage /></RequireSection> },
      { path: 'users/new', element: <RequireSection section="users"><CreateUserPage /></RequireSection> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
