import { Navigate } from 'react-router-dom'
import { usePermission } from '../../context/PermissionContext'
import { ACTIONS } from '../../utils/permissions'
import type { ReactNode } from 'react'

interface PermissionGuardProps {
    feature?: string
    action?: string
    children: ReactNode
}

export default function PermissionGuard({
    feature,
    action = ACTIONS.VIEW,
    children,
}: PermissionGuardProps) {
    const { can } = usePermission()

    // If no specific feature is required, render children directly
    if (!feature) return <>{children}</>

    // Check if user has permission
    const hasAccess = can(feature, action)

    if (!hasAccess) {
        // Redirect to 403 or dashboard if unauthorized
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
