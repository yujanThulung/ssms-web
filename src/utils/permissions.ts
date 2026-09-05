import type { AuthUser } from "../context/AuthContext"

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  TEACHER: 'TEACHER',
} as const

export type RoleType = typeof ROLES[keyof typeof ROLES]

export const FEATURES = {
  STUDENT: 'student',
  USER: 'user',
  ROLE: 'role',
  ACCOUNT: 'account',
  SETTINGS: 'settings',
  DASHBOARD: 'dashboard',
} as const

export const ACTIONS = {
  VIEW: 'VIEW',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ASSIGN: 'ASSIGN',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  PUBLISH: 'PUBLISH',
  ARCHIVE: 'ARCHIVE',
  CANCEL: 'CANCEL',
  EXPORT: 'EXPORT',
  DOWNLOAD: 'DOWNLOAD',
  PRINT: 'PRINT',
} as const

export type FeatureType = typeof FEATURES[keyof typeof FEATURES]
export type ActionType = typeof ACTIONS[keyof typeof ACTIONS]

/** Check if user is Super Admin */
export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role?.name === ROLES.SUPER_ADMIN
}

/** Check if user has ANY of the specified roles */
export function hasRole(user: AuthUser | null, ...roles: string[]): boolean {
  if (!user?.role?.name) return false
  return roles.includes(user.role.name)
}

/** Check if user has permission to perform an action on a feature */
export function hasPermission(
  user: AuthUser | null,
  feature: FeatureType | string,
  action: ActionType | string
): boolean {
  if (!user) return false

  // Super Admin has universal bypass
  if (isSuperAdmin(user)) return true

  return (
    user.permissions?.some(
      (p) =>
        p.feature.toLowerCase() === feature.toLowerCase() &&
        p.action.toLowerCase() === action.toLowerCase()
    ) ?? false
  )
}
