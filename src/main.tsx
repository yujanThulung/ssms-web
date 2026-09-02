import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/ AuthContext'
import { PermissionProvider } from './context/PermissionContext'
import AppRouter from './routes/index'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#15803d',
        },
      }}
    >
      <AuthProvider>
        <PermissionProvider>
          <AppRouter />
          <Toaster richColors position="top-right" />
        </PermissionProvider>
      </AuthProvider>
    </ConfigProvider>
  </StrictMode>
)
