import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/ AuthContext'
import { PermissionProvider } from './context/PermissionContext'
import AppRouter from './routes/index'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <PermissionProvider>
        <AppRouter />
        <Toaster richColors position="top-right" />
      </PermissionProvider>
    </AuthProvider>
  </StrictMode>
)
