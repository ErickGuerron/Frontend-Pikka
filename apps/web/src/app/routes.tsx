import type { RouteObject } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth, RequireRole } from '@/features/auth/guards'
import { DriversPage } from '@/features/drivers/DriversPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { RoutesPage } from '@/features/routing/RoutesPage'
import { TrackingPage } from '@/features/tracking/TrackingPage'
import { CreateUserPage } from '@/features/users/CreateUserPage'
import { UsersPage } from '@/features/users/UsersPage'
import { ZonesPage } from '@/features/zones/ZonesPage'
import { AppLayout } from './AppLayout'
import { HomePage } from './HomePage'
import { NotFoundPage } from './NotFoundPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'zones', element: <ZonesPage /> },
      { path: 'routes', element: <RoutesPage /> },
      { path: 'drivers', element: <DriversPage /> },
      { path: 'tracking', element: <TrackingPage /> },
      {
        path: 'users',
        element: (
          <RequireRole roles={['ADMIN']}>
            <UsersPage />
          </RequireRole>
        ),
      },
      {
        path: 'users/new',
        element: (
          <RequireRole roles={['ADMIN']}>
            <CreateUserPage />
          </RequireRole>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
