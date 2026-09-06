import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'

import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/login/LoginPage'
import { useAuth } from '../context/AuthContext'
import PermissionGuard from '../components/common/PermissionGuard'
import { FEATURES } from '../utils/permissions'

// 1. Dynamic imports (loads page JS only when visited)
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const StudentsPage = lazy(() => import('../pages/students/StudentsPage'))
const UsersPage = lazy(() => import('../pages/users/Users'))
const AccountsPage = lazy(() => import('../pages/accounts/AccountsPage'))
const PermissionsPage = lazy(() => import('../pages/permissions/PermissionsPage'))
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))

// 2. All routes in one clean list
const protectedRoutes = [
  { path: '', element: <DashboardPage /> },
  { path: 'students', element: <StudentsPage />, feature: FEATURES.STUDENT },
  { path: 'users', element: <UsersPage />, feature: FEATURES.USER },
  { path: 'accounts', element: <AccountsPage />, feature: FEATURES.ACCOUNT },
  { path: 'permissions', element: <PermissionsPage />, feature: FEATURES.ROLE },
  { path: 'settings', element: <SettingsPage /> },
]

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function AppRouter() {
  const { isAuthenticated } = useAuth()

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Spin size="large" />
          </div>
        }
      >
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            {protectedRoutes.map(({ path, element, feature }) => (
              <Route
                key={path}
                path={path}
                element={<PermissionGuard feature={feature}>{element}</PermissionGuard>}
              />
            ))}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
