import {
  FeeStructureStatus,
  type FeeFrequency,
  type FeeStructureTotals,
} from './types'

// ─── Status presentation ──────────────────────────────────────────────────────

export const FEE_STRUCTURE_STATUS_OPTIONS: { label: string; value: FeeStructureStatus }[] = [
  { label: 'Draft', value: FeeStructureStatus.DRAFT },
  { label: 'Pending Approval', value: FeeStructureStatus.PENDING_APPROVAL },
  { label: 'Approved', value: FeeStructureStatus.APPROVED },
  { label: 'Rejected', value: FeeStructureStatus.REJECTED },
  { label: 'Archived', value: FeeStructureStatus.ARCHIVED },
]

export const FEE_STRUCTURE_STATUS_COLOR: Record<FeeStructureStatus, string> = {
  DRAFT: 'processing',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  ARCHIVED: 'default',
}

export const FEE_STRUCTURE_STATUS_LABEL: Record<FeeStructureStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived',
}

/**
 * The happy path only — Draft → Pending Approval → Approved. Rejected and
 * Archived are exits from this path, not steps on it, so the stepper does not
 * pretend they are sequential.
 */
export const FEE_STRUCTURE_LIFECYCLE: FeeStructureStatus[] = [
  FeeStructureStatus.DRAFT,
  FeeStructureStatus.PENDING_APPROVAL,
  FeeStructureStatus.APPROVED,
]

/** Every status the API can report — used for filters, tabs and counts. */
export const FEE_STRUCTURE_ALL_STATUSES: FeeStructureStatus[] = [
  ...FEE_STRUCTURE_LIFECYCLE,
  FeeStructureStatus.REJECTED,
  FeeStructureStatus.ARCHIVED,
]

// ─── Workflow ─────────────────────────────────────────────────────────────────

export type FeeStructureAction = 'SUBMIT' | 'RESUBMIT' | 'APPROVE' | 'REJECT' | 'ARCHIVE'

export const FEE_STRUCTURE_ACTION_LABEL: Record<FeeStructureAction, string> = {
  SUBMIT: 'Submit for Approval',
  RESUBMIT: 'Resubmit for Approval',
  APPROVE: 'Approve',
  REJECT: 'Reject',
  ARCHIVE: 'Archive',
}

export const FEE_STRUCTURE_ACTION_TARGET: Record<FeeStructureAction, FeeStructureStatus> = {
  SUBMIT: FeeStructureStatus.PENDING_APPROVAL,
  RESUBMIT: FeeStructureStatus.PENDING_APPROVAL,
  APPROVE: FeeStructureStatus.APPROVED,
  REJECT: FeeStructureStatus.REJECTED,
  ARCHIVE: FeeStructureStatus.ARCHIVED,
}

/** Which endpoint carries each action — they are not interchangeable. */
export type FeeStructureEndpoint = 'status' | 'review'

/**
 * The API splits the workflow across two endpoints with different permission
 * requirements, so the action table has to carry that split too:
 *
 *   PATCH /fee-structures/:id/status  → requires UPDATE
 *     DRAFT    → PENDING_APPROVAL
 *     REJECTED → PENDING_APPROVAL
 *
 *   PATCH /fee-structures/:id/review  → requires APPROVE
 *     PENDING_APPROVAL → APPROVED
 *     PENDING_APPROVAL → REJECTED
 *     APPROVED         → ARCHIVED
 *
 * Any other combination is rejected with 409, so the UI must never offer it.
 */
export const FEE_STRUCTURE_TRANSITIONS: Record<
  FeeStructureStatus,
  FeeStructureAction[]
> = {
  DRAFT: ['SUBMIT'],
  REJECTED: ['RESUBMIT'],
  PENDING_APPROVAL: ['APPROVE', 'REJECT'],
  APPROVED: ['ARCHIVE'],
  ARCHIVED: [],
}

export const FEE_STRUCTURE_ACTION_ENDPOINT: Record<
  FeeStructureAction,
  FeeStructureEndpoint
> = {
  SUBMIT: 'status',
  RESUBMIT: 'status',
  APPROVE: 'review',
  REJECT: 'review',
  ARCHIVE: 'review',
}

/**
 * Fee heads can be added / edited / removed while the structure is a DRAFT or a
 * REJECTED one — a rejected structure has to be revisable, otherwise the legal
 * REJECTED → PENDING_APPROVAL transition would resubmit an unchanged structure.
 * Once submitted the API rejects line mutations with 400, so the editor locks
 * rather than letting the user hit a wall.
 */
export function isStructureEditable(status: FeeStructureStatus | null | undefined): boolean {
  return status === FeeStructureStatus.DRAFT || status === FeeStructureStatus.REJECTED
}

export function getAllowedActions(
  status: FeeStructureStatus | null | undefined,
): FeeStructureAction[] {
  if (!status) return []
  return FEE_STRUCTURE_TRANSITIONS[status] ?? []
}

export function getActionEndpoint(action: FeeStructureAction): FeeStructureEndpoint {
  return FEE_STRUCTURE_ACTION_ENDPOINT[action]
}

/**
 * The single action that ends the creation flow. Everything else is a review
 * decision and lives behind the status control in the list.
 */
export function getSubmitAction(
  status: FeeStructureStatus | null | undefined,
): FeeStructureAction | null {
  const action = getAllowedActions(status).find(
    (candidate) => FEE_STRUCTURE_ACTION_ENDPOINT[candidate] === 'status',
  )
  return action ?? null
}

export function getLifecycleIndex(status: FeeStructureStatus | null | undefined): number {
  if (!status) return 0
  if (status === FeeStructureStatus.REJECTED) return 0
  const idx = FEE_STRUCTURE_LIFECYCLE.indexOf(status)
  return idx === -1 ? 0 : idx
}

// ─── Frequency presentation ───────────────────────────────────────────────────

export const FEE_FREQUENCY_OPTIONS: { label: string; value: FeeFrequency }[] = [
  { label: 'Monthly', value: 'MONTHLY' as FeeFrequency },
  { label: 'Per Term', value: 'TERM' as FeeFrequency },
  { label: 'Yearly', value: 'YEARLY' as FeeFrequency },
  { label: 'One Time', value: 'ONE_TIME' as FeeFrequency },
]

export const FEE_FREQUENCY_LABEL: Record<string, string> = {
  MONTHLY: 'Monthly',
  TERM: 'Per Term',
  YEARLY: 'Yearly',
  ONE_TIME: 'One Time',
}

export const FEE_FREQUENCY_COLOR: Record<string, string> = {
  MONTHLY: 'blue',
  TERM: 'purple',
  YEARLY: 'green',
  ONE_TIME: 'orange',
}

export function getFrequencyLabel(frequency: string | null | undefined): string {
  if (!frequency) return '—'
  return FEE_FREQUENCY_LABEL[frequency] ?? frequency
}

// ─── Totals ───────────────────────────────────────────────────────────────────

export const EMPTY_TOTALS: FeeStructureTotals = { monthly: 0, term: 0, yearly: 0, oneTime: 0 }

export function hasAnyTotal(totals: FeeStructureTotals): boolean {
  return totals.monthly > 0 || totals.term > 0 || totals.yearly > 0 || totals.oneTime > 0
}

/** Human "Rs. 12,000" label — matches the fee-category page formatting. */
export function formatMoney(value: string | number | null | undefined): string {
  if (value == null || value === '') return 'Rs. 0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) return 'Rs. 0'
  return `Rs. ${num.toLocaleString('en-IN')}`
}
