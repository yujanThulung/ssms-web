import React from 'react'
import {
    BS_MONTH_NAMES_EN,
    BS_MONTH_NAMES_NE,
    BS_MIN_YEAR,
    BS_MAX_YEAR,
    toNepaliNumerals,
} from './calendarUtils'
import type { NepaliLocale } from './types'

interface CalendarHeaderProps {
    year: number
    month: number
    minYear?: number
    maxYear?: number
    locale?: NepaliLocale
    onChangeYear: (newYear: number) => void
    onChangeMonth: (newMonth: number) => void
    onPrevMonth?: () => void
    onNextMonth?: () => void
    onPrevYear?: () => void
    onNextYear?: () => void
    showYearNav?: boolean
    showMonthNav?: boolean
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    year,
    month,
    minYear = BS_MIN_YEAR,
    maxYear = BS_MAX_YEAR,
    locale = 'en',
    onChangeYear,
    onChangeMonth,
    onPrevMonth,
    onNextMonth,
    onPrevYear,
    onNextYear,
    showYearNav = true,
    showMonthNav = true,
}) => {
    // Generate years array from minYear to maxYear
    const years = React.useMemo(() => {
        const arr: number[] = []
        for (let y = minYear; y <= maxYear; y++) {
            arr.push(y)
        }
        return arr
    }, [minYear, maxYear])

    const monthNames = locale === 'ne' ? BS_MONTH_NAMES_NE : BS_MONTH_NAMES_EN

    return (
        <div className="nc-header">
            <div className="nc-header-nav">
                {showYearNav && onPrevYear && (
                    <button
                        type="button"
                        className="nc-nav-btn"
                        title={locale === 'ne' ? 'अघिल्लो वर्ष' : 'Previous Year'}
                        onClick={onPrevYear}
                        disabled={year <= minYear}
                    >
                        «
                    </button>
                )}
                {showMonthNav && onPrevMonth && (
                    <button
                        type="button"
                        className="nc-nav-btn"
                        title={locale === 'ne' ? 'अघिल्लो महिना' : 'Previous Month'}
                        onClick={onPrevMonth}
                        disabled={year <= minYear && month <= 1}
                    >
                        ‹
                    </button>
                )}
            </div>

            <div className="nc-header-selectors">
                {/* Month Selector */}
                <select
                    className="nc-select"
                    value={month}
                    onChange={(e) => onChangeMonth(Number(e.target.value))}
                    aria-label="Select BS Month"
                >
                    {monthNames.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                            {name}
                        </option>
                    ))}
                </select>

                {/* Year Selector */}
                <select
                    className="nc-select"
                    value={year}
                    onChange={(e) => onChangeYear(Number(e.target.value))}
                    aria-label="Select BS Year"
                >
                    {years.map((y) => (
                        <option key={y} value={y}>
                            {locale === 'ne' ? `${toNepaliNumerals(y)} वि.सं.` : `${y} BS`}
                        </option>
                    ))}
                </select>
            </div>

            <div className="nc-header-nav">
                {showMonthNav && onNextMonth && (
                    <button
                        type="button"
                        className="nc-nav-btn"
                        title={locale === 'ne' ? 'पछिल्लो महिना' : 'Next Month'}
                        onClick={onNextMonth}
                        disabled={year >= maxYear && month >= 12}
                    >
                        ›
                    </button>
                )}
                {showYearNav && onNextYear && (
                    <button
                        type="button"
                        className="nc-nav-btn"
                        title={locale === 'ne' ? 'पछिल्लो वर्ष' : 'Next Year'}
                        onClick={onNextYear}
                        disabled={year >= maxYear}
                    >
                        »
                    </button>
                )}
            </div>
        </div>
    )
}
