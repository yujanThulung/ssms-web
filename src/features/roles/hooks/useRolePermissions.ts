import { useQuery } from '@tanstack/react-query'
import { getRolePermissions } from '../api'
import type { RolePermission } from '../types'

export function useRolePermissions(roleId: string | null) {
  return useQuery<RolePermission[]>({
    queryKey: ['role-permissions', roleId],
    queryFn: () => getRolePermissions(roleId!),
    enabled: Boolean(roleId),
  })
}
