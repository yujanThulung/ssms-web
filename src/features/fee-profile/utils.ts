import type { FeeProfile } from './types'

/**
 * The API can return fee-profile payloads either raw or wrapped in the standard
 * `{ success, message, data }` envelope. Normalise both so consumers can rely
 * on a single shape.
 */
export function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data
    if (data !== undefined && data !== null) return data as T
  }
  return payload as T
}

/**
 * Merges warnings returned by the API with client-side checks that are cheap
 * and unambiguous. Duplicate categories are the main one: a fee category that
 * exists in both the class structure and the student's additional fees is very
 * likely a double-billing mistake.
 */
export function buildFeeProfileWarnings(profile?: FeeProfile | null): string[] {
  const warnings = [...(profile?.warnings ?? [])].filter(
    (warning): warning is string => typeof warning === 'string' && warning.trim().length > 0,
  )

  const add = (message: string) => {
    const normalised = message.trim().toLowerCase()
    if (!warnings.some((warning) => warning.trim().toLowerCase() === normalised)) {
      warnings.push(message)
    }
  }

  if (profile?.feeStructure && profile.feeStructure.hasApprovedStructure === false) {
    add('No approved fee structure for this class and academic year — fees shown may be incomplete.')
  }

  const classFeeCategoryIds = new Set(
    (profile?.classFees ?? []).map((fee) => fee.feeCategoryId).filter(Boolean),
  )

  for (const fee of profile?.additionalFees ?? []) {
    if (!fee.feeCategoryId || !classFeeCategoryIds.has(fee.feeCategoryId)) continue
    const code = fee.categoryCode ? ` (${fee.categoryCode})` : ''
    add(
      `Fee category '${fee.categoryName}'${code} exists in both class fees and additional fees — possible duplicate billing.`,
    )
  }

  return warnings
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}
