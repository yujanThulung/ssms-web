export interface Role {
  id: string
  name: string
  description: string
  isSystemRole: boolean
  userCount: number
  createdAt: string
  updatedAt: string
}

export interface RolePermission {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  feature: string
  action: string
  description: string
  granted: boolean
}

export interface UpdateRolePermissionsPayload {
  permissionIds: string[]
}
