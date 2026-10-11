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
  FEE_CATEGORY: 'fee_category',
  FEE_STRUCTURE: 'fee_structure',
  ACADEMIC_YEAR: 'academic_year',
  CLASS_SECTION: 'class_section',
  SETTINGS: 'settings',
  DASHBOARD: 'dashboard',
  DISCOUNT_SCHOLARSHIP: 'discount_scholarship',
  PROGRAM_ASSIGNMENT: 'assignment',
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

/** Accepts legacy/alternate feature names for the same capability. */
const FEATURE_ALIASES: Record<string, string[]> = {
  [FEATURES.PROGRAM_ASSIGNMENT]: [FEATURES.PROGRAM_ASSIGNMENT, 'program_assignment'],
}

/** Check if user has permission to perform an action on a feature */
export function hasPermission(
  user: AuthUser | null,
  feature: FeatureType | string,
  action: ActionType | string,
): boolean {
  if (!user) return false;

  if (isSuperAdmin(user)) return true;

  const acceptedFeatures = FEATURE_ALIASES[feature] ?? [feature]

  return (
    user.permissions?.some(
      (p) =>
        acceptedFeatures.includes(p?.feature) &&
        p?.action === action
    ) ?? false
  );
}