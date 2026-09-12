/**
 * 100% Standalone Nepali (Bikram Sambat / BS) Calendar Dataset & Conversion Engine
 *
 * Dataset: BS 2060 to BS 2100 verified Panchanga calendar data.
 * Epoch: BS 2060-01-01 corresponds to Gregorian (AD) 2003-04-14.
 */

export const BS_MIN_YEAR = 2060
export const BS_MAX_YEAR = 2100

export const BS_EPOCH_AD = { year: 2003, month: 4, day: 14 } as const

const MS_PER_DAY = 864e5

/**
 * Month lengths (days) for each BS year from 2060 to 2100 (Baisakh -> Chaitra)
 */
export const BS_MONTH_DAYS: Record<number, readonly number[]> = {
  2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],

  2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],

  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2082: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],

  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2091: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2092: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2093: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2094: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2095: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2096: [30, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2097: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2098: [31, 31, 32, 31, 31, 31, 29, 30, 29, 30, 30, 31],
  2099: [31, 31, 32, 31, 31, 31, 30, 29, 29, 30, 30, 30],

  2100: [31, 32, 31, 32, 30, 31, 30, 29, 30, 29, 30, 30],
}

export const BS_MONTH_NAMES_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashoj',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const

export const BS_MONTH_NAMES_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फाल्गुन',
  'चैत्र',
] as const

export const BS_WEEKDAY_NAMES_EN_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const BS_WEEKDAY_NAMES_NE_SHORT = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'] as const

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

/**
 * Converts standard Arabic digits to Devanagari numerals.
 */
export function toNepaliNumerals(input: string | number): string {
  return String(input).replace(/\d/g, (d) => DEVANAGARI_DIGITS[Number(d)] ?? d)
}

/**
 * Returns number of days in a given BS month (1 = Baisakh, 12 = Chaitra).
 */
export function daysInBsMonth(year: number, month: number): number {
  const row = BS_MONTH_DAYS[year]
  if (!row || month < 1 || month > 12) {
    return 30
  }
  return row[month - 1] ?? 30
}

/**
 * Returns total days in a BS year.
 */
export function getDaysInBsYear(year: number): number {
  const row = BS_MONTH_DAYS[year]
  if (!row) return 365
  return row.reduce((sum, d) => sum + d, 0)
}

function daysFromBsEpoch(date: { year: number; month: number; day: number }): number {
  let days = 0
  for (let y = BS_MIN_YEAR; y < date.year; y++) {
    days += getDaysInBsYear(y)
  }
  for (let m = 1; m < date.month; m++) {
    days += daysInBsMonth(date.year, m)
  }
  return days + (date.day - 1)
}

function utcMsFromParts(parts: { year: number; month: number; day: number }): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day)
}

function utcCivilParts(ms: number): { year: number; month: number; day: number } {
  const d = new Date(ms)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  }
}

/**
 * Convert BS date to Gregorian (AD) civil parts.
 */
export function bsToAdParts(bs: { year: number; month: number; day: number }): { year: number; month: number; day: number } {
  const offsetDays = daysFromBsEpoch(bs)
  const epochMs = utcMsFromParts(BS_EPOCH_AD)
  return utcCivilParts(epochMs + offsetDays * MS_PER_DAY)
}

/**
 * Convert Gregorian (AD) date to BS date parts.
 */
export function adToBs(adInput: Date | string | { year: number; month: number; day: number }): { year: number; month: number; day: number } {
  let ad: { year: number; month: number; day: number }
  if (adInput instanceof Date) {
    ad = {
      year: adInput.getFullYear(),
      month: adInput.getMonth() + 1,
      day: adInput.getDate(),
    }
  } else if (typeof adInput === 'string') {
    const clean = adInput.includes('T') ? adInput.slice(0, 10) : adInput.trim()
    const [y, m, d] = clean.split('-').map(Number)
    ad = { year: y, month: m, day: d }
  } else {
    ad = adInput
  }

  const epochMs = utcMsFromParts(BS_EPOCH_AD)
  const targetMs = Date.UTC(ad.year, ad.month - 1, ad.day)
  let remainingDays = Math.round((targetMs - epochMs) / MS_PER_DAY)

  if (remainingDays < 0) {
    return { year: BS_MIN_YEAR, month: 1, day: 1 }
  }

  let bsYear = BS_MIN_YEAR
  while (bsYear <= BS_MAX_YEAR) {
    const yearDays = getDaysInBsYear(bsYear)
    if (remainingDays < yearDays) break
    remainingDays -= yearDays
    bsYear += 1
  }

  let bsMonth = 1
  while (bsMonth <= 12) {
    const mDays = daysInBsMonth(bsYear, bsMonth)
    if (remainingDays < mDays) break
    remainingDays -= mDays
    bsMonth += 1
  }

  return { year: Math.min(bsYear, BS_MAX_YEAR), month: bsMonth, day: remainingDays + 1 }
}

/**
 * Weekday of a BS date: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 */
export function getBsWeekday(bs: { year: number; month: number; day: number }): number {
  const ad = bsToAdParts(bs)
  return new Date(Date.UTC(ad.year, ad.month - 1, ad.day)).getUTCDay()
}

/**
 * Returns today's BS date parts.
 */
export function todayBs(): { year: number; month: number; day: number } {
  return adToBs(new Date())
}
