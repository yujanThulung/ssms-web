import { useMemo } from 'react'
import { toast } from 'sonner'

import { usePermission } from '../../context/PermissionContext'
import { ACTIONS, FEATURES } from '../../utils/permissions'
import {
  FEE_STRUCTURE_ACTION_ENDPOINT,
  FEE_STRUCTURE_ACTION_LABEL,
  FEE_STRUCTURE_ACTION_TARGET,
  FEE_STRUCTURE_STATUS_COLOR,
  FEE_STRUCTURE_STATUS_LABEL,
  getAllowedActions,
  useReviewFeeStructure,
  useUpdateFeeStructureStatus,
} from '../../features/fee-structures'
import type {
  FeeStructureAction,
  FeeStructureStatus,
} from '../../features/fee-structures'
import type { StatusChangeOption } from '../../components/common/StatusChangeModal'

export interface StatusChangeTarget {
  structureId: string
  className: string
  academicYearName: string
  status: FeeStructureStatus
}

/** What each review decision means, shown once an option is picked. */
const ACTION_HELP: Record<FeeStructureAction, string> = {
  SUBMIT: 'An approver will be able to review these fee heads.',
  RESUBMIT: 'Your changes go back to an approver for another look.',
  APPROVE: 'Once approved, this structure can be applied to students.',
  REJECT: 'The fee heads become editable again so you can fix and resubmit them.',
  ARCHIVE: 'Archiving closes this structure. Set up a new draft to change the fees later.',
}

/**
 * Which permission gates an action. This mirrors the API contract rather than
 * the old "UPDATE implies everything" shortcut, because the workflow is split
 * across two separately-gated endpoints:
 *
 *   PATCH /fee-structures/:id/status → requires UPDATE  (submit, resubmit)
 *   PATCH /fee-structures/:id/review → requires APPROVE (approve, reject, archive)
 *
 * So a user with only CREATE/UPDATE can build and submit a structure but never
 * approve it, and archiving needs APPROVE because it rides on /review.
 */
export function isActionAllowed(
  action: FeeStructureAction,
  can: ReturnType<typeof usePermission>['can'],
): boolean {
  return FEE_STRUCTURE_ACTION_ENDPOINT[action] === 'review'
    ? can(FEATURES.FEE_STRUCTURE, ACTIONS.APPROVE)
    : can(FEATURES.FEE_STRUCTURE, ACTIONS.UPDATE)
}

/**
 * Everything the generic StatusChangeModal needs for a fee structure: the
 * permitted next statuses, and a confirm handler that routes to
 * PATCH /status (UPDATE) or PATCH /review (APPROVE) as the contract requires.
 *
 * Kept as a hook rather than a wrapper component so the common modal can be
 * used directly from the page.
 */
export function useFeeStructureStatusChange(target: StatusChangeTarget | null) {
  const { can } = usePermission()
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateFeeStructureStatus()
  const { mutateAsync: review, isPending: isReviewing } = useReviewFeeStructure()

  const allowedActions = useMemo(
    () => (target ? getAllowedActions(target.status) : []),
    [target],
  )

  const options = useMemo<StatusChangeOption<FeeStructureStatus>[]>(
    () =>
      allowedActions
        .filter((action) => isActionAllowed(action, can))
        .map((action) => {
          const next = FEE_STRUCTURE_ACTION_TARGET[action]
          return {
            value: next,
            label: FEE_STRUCTURE_STATUS_LABEL[next],
            color: FEE_STRUCTURE_STATUS_COLOR[next],
            help: `${FEE_STRUCTURE_ACTION_LABEL[action]} — ${ACTION_HELP[action]}`,
          }
        }),
    [allowedActions, can],
  )

  const handleConfirm = async (next: FeeStructureStatus) => {
    if (!target) return

    const action = allowedActions.find(
      (candidate) => FEE_STRUCTURE_ACTION_TARGET[candidate] === next,
    )
    if (!action) return

    try {
      if (FEE_STRUCTURE_ACTION_ENDPOINT[action] === 'review') {
        await review({ id: target.structureId, payload: { status: next } })
      } else {
        await updateStatus({ id: target.structureId, payload: { status: next } })
      }
      toast.success(
        `${target.className} is now ${FEE_STRUCTURE_STATUS_LABEL[next].toLowerCase()}`,
      )
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Status change failed')
      // Re-thrown so the modal stays open on failure; it closes only on success.
      throw err
    }
  }

  return {
    options,
    handleConfirm,
    isPending: isUpdating || isReviewing,
    emptyMessage:
      allowedActions.length === 0
        ? 'No further transitions are allowed from this status.'
        : 'You do not have permission to change this status.',
  }
}
