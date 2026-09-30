import type { QueryClient } from '@tanstack/react-query'
import type { FeeStructureListParams } from './types'

/**
 * Centralised query keys. Every mutation in this feature invalidates
 * `feeStructureKeys.all`, which prefix-matches both the list and detail keys —
 * replacing the predicate that each hook used to repeat by hand.
 */
export const feeStructureKeys = {
  all: ['fee-structures'] as const,
  lists: () => [...feeStructureKeys.all, 'list'] as const,
  list: (params: FeeStructureListParams = {}) =>
    [...feeStructureKeys.lists(), params] as const,
  details: () => [...feeStructureKeys.all, 'detail'] as const,
  detail: (id: string | null | undefined) =>
    [...feeStructureKeys.details(), id ?? ''] as const,
}

export function invalidateFeeStructures(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: feeStructureKeys.all })
}
