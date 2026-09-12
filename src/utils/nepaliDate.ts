/**
 * Utility functions for Nepali (Bikram Sambat) <-> English (AD) date conversion.
 * Powered by local standalone calendarData engine.
 *
 * All "ISO" strings are YYYY-MM-DD format.
 * BS months are 1-based (1 = Baisakh, 12 = Chaitra).
 */
import { bsToAdParts, adToBs, BS_MONTH_NAMES_EN } from '../components/nepali-calendar/calendarData'

// ─── BS → AD ────────────────────────────────────────────────────────────────

/**
 * Convert a BS ISO string "YYYY-MM-DD" to an AD ISO string "YYYY-MM-DD".
 */
export function bsIsoToAdIso(bsIso: string): string {
    const [y, m, d] = bsIso.split('-').map(Number)
    const ad = bsToAdParts({ year: y, month: m, day: d })
    return `${ad.year}-${String(ad.month).padStart(2, '0')}-${String(ad.day).padStart(2, '0')}`
}

// ─── AD → BS ────────────────────────────────────────────────────────────────

/**
 * Convert an AD ISO string "YYYY-MM-DD" to a BS ISO string "YYYY-MM-DD".
 */
export function adIsoToBsIso(adIso: string): string {
    const [y, m, d] = adIso.split('-').map(Number)
    const bs = adToBs(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    return `${bs.year}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')}`
}

// ─── Display helpers ─────────────────────────────────────────────────────────

/**
 * Returns a human-readable BS date string like "15 Baisakh 2082"
 * from a BS ISO string.
 */
export function formatBsIso(bsIso: string): string {
    const [y, m, d] = bsIso.split('-').map(Number)
    const monthName = BS_MONTH_NAMES_EN[m - 1] ?? ''
    return `${d} ${monthName} ${y}`
}

/**
 * Returns a human-readable BS date from an AD ISO string.
 * e.g. "15 Ashoj 2082"
 */
export function formatBsDateFromAd(adIso: string): string {
    return formatBsIso(adIsoToBsIso(adIso))
}
