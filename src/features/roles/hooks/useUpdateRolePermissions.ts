import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateRolePermissions } from '../api'
import type { RolePermission, UpdateRolePermissionsPayload } from '../types'

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation<
    RolePermission[],
    Error,
    { roleId: string; payload: UpdateRolePermissionsPayload }
  >({
    mutationFn: ({ roleId, payload }) => updateRolePermissions(roleId, payload),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', roleId] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Role permissions updated successfully')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update permissions')
    },
  })
}
