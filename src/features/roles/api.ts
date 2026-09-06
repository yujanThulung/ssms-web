import client from '../../lib/api/client'
import { ENDPOINTS } from '../../lib/api/endpoints'
import type { Role, RolePermission, UpdateRolePermissionsPayload } from './types'

export async function getRoles(): Promise<Role[]> {
  const { data } = await client.get<{ success: boolean; data: Role[] }>(ENDPOINTS.ROLES.BASE)
  return data.data ?? []
}

export async function getRolePermissions(roleId: string): Promise<RolePermission[]> {
  const { data } = await client.get<{ success: boolean; data: RolePermission[] }>(
    ENDPOINTS.ROLES.PERMISSIONS(roleId)
  )
  return data.data ?? []
}

export async function updateRolePermissions(
  roleId: string,
  payload: UpdateRolePermissionsPayload
): Promise<RolePermission[]> {
  const { data } = await client.patch<{ success: boolean; data: RolePermission[] }>(
    ENDPOINTS.ROLES.PERMISSIONS(roleId),
    payload
  )
  return data.data ?? []
}
