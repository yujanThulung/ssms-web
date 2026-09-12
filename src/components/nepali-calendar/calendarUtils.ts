import {
    daysInBsMonth,
    getBsWeekday,
    bsToAdParts,
    todayBs,
    toNepaliNumerals,
    BS_MONTH_NAMES_EN,
    BS_MONTH_NAMES_NE,
    BS_WEEKDAY_NAMES_EN_SHORT,
    BS_WEEKDAY_NAMES_NE_SHORT,
    BS_MIN_YEAR,
    BS_MAX_YEAR,
} from './calendarData'

export {
    toNepaliNumerals,
    BS_MONTH_NAMES_EN,
    BS_MONTH_NAMES_NE,
    BS_WEEKDAY_NAMES_EN_SHORT,
    BS_WEEKDAY_NAMES_NE_SHORT,
    BS_MIN_YEAR,
    BS_MAX_YEAR,
}

export interface SimpleBsDate {
    year: number
    month: number
    day: number
}

export function parseBsDate(iso?: string): SimpleBsDate | null {
    if (!iso) return null
    const parts = iso.trim().split('-').map(Number)
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
        return null
    }
    return { year: parts[0], month: parts[1], day: parts[2] }
}

export function formatBsDate(d: SimpleBsDate): string {
    return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

export function compareBsDates(a: SimpleBsDate, b: SimpleBsDate): number {
    if (a.year !== b.year) return a.year - b.year
    if (a.month !== b.month) return a.month - b.month
    return a.day - b.day
}

export function getTodayBsDate(): SimpleBsDate {
    const t = todayBs()
    return { year: t.year, month: t.month, day: t.day }
}

export function getDaysCountInMonth(year: number, month: number): number {
    try {
        return daysInBsMonth(year, month)
    } catch {
        return 30
    }
}

export function getFirstWeekdayOfMonth(year: number, month: number): number {
    try {
        return getBsWeekday({ year, month, day: 1 })
    } catch {
        return 0
    }
}

export function getAdDayForBs(year: number, month: number, day: number): number | null {
    try {
        const ad = bsToAdParts({ year, month, day })
        return ad.day
    } catch {
        return null
    }
}

export function addMonthsToView(year: number, month: number, delta: number): { year: number; month: number } {
    let totalMonths = year * 12 + (month - 1) + delta
    const newYear = Math.floor(totalMonths / 12)
    const newMonth = (totalMonths % 12) + 1
    return { year: newYear, month: newMonth }
}

export function formatBsDisplay(iso?: string, locale: 'en' | 'ne' = 'en'): string {
    const parsed = parseBsDate(iso)
    if (!parsed) return ''
    if (locale === 'ne') {
        const nepaliMonth = BS_MONTH_NAMES_NE[parsed.month - 1] ?? ''
        const nepaliDay = toNepaliNumerals(parsed.day)
        const nepaliYear = toNepaliNumerals(parsed.year)
        return `${nepaliDay} ${nepaliMonth} ${nepaliYear}`
    }
    const englishMonth = BS_MONTH_NAMES_EN[parsed.month - 1] ?? ''
    return `${parsed.day} ${englishMonth} ${parsed.year}`
}

export function getMonthNames(locale: 'en' | 'ne' = 'en') {
    return locale === 'ne' ? BS_MONTH_NAMES_NE : BS_MONTH_NAMES_EN
}

export function getWeekdayNames(locale: 'en' | 'ne' = 'en') {
    return locale === 'ne' ? BS_WEEKDAY_NAMES_NE_SHORT : BS_WEEKDAY_NAMES_EN_SHORT
}

export function calculateDaysBetween(fromIso: string, toIso: string): number {
    try {
        const from = parseBsDate(fromIso)
        const to = parseBsDate(toIso)
        if (!from || !to) return 0
        const adFrom = bsToAdParts(from)
        const adTo = bsToAdParts(to)
        const d1 = new Date(adFrom.year, adFrom.month - 1, adFrom.day)
        const d2 = new Date(adTo.year, adTo.month - 1, adTo.day)
        const diffTime = Math.abs(d2.getTime() - d1.getTime())
        return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1
    } catch {
        return 0
    }
}
