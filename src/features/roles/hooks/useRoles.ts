import { useQuery } from '@tanstack/react-query'
import { getRoles } from '../api'
import type { Role } from '../types'

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: getRoles,
  })
}
