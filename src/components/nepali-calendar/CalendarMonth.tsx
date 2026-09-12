import React from 'react'
import {
    BS_WEEKDAY_NAMES_EN_SHORT,
    BS_WEEKDAY_NAMES_NE_SHORT,
    toNepaliNumerals,
    getDaysCountInMonth,
    getFirstWeekdayOfMonth,
    formatBsDate,
    getAdDayForBs,
    getTodayBsDate,
    compareBsDates,
    parseBsDate,
    type SimpleBsDate,
} from './calendarUtils'
import type { NepaliLocale } from './types'

interface CalendarMonthProps {
    year: number
    month: number
    locale?: NepaliLocale
    selectedDate?: string // YYYY-MM-DD
    rangeStart?: string   // YYYY-MM-DD
    rangeEnd?: string     // YYYY-MM-DD
    hoverDate?: string    // YYYY-MM-DD
    minDate?: string
    maxDate?: string
    showAdEquivalent?: boolean
    onSelectDay: (iso: string) => void
    onHoverDay?: (iso: string | null) => void
}

export const CalendarMonth: React.FC<CalendarMonthProps> = ({
    year,
    month,
    locale = 'en',
    selectedDate,
    rangeStart,
    rangeEnd,
    hoverDate,
    minDate,
    maxDate,
    showAdEquivalent = false,
    onSelectDay,
    onHoverDay,
}) => {
    const daysInMonth = getDaysCountInMonth(year, month)
    const firstWeekday = getFirstWeekdayOfMonth(year, month)
    const today = React.useMemo(() => getTodayBsDate(), [])

    const minDateObj = React.useMemo(() => parseBsDate(minDate), [minDate])
    const maxDateObj = React.useMemo(() => parseBsDate(maxDate), [maxDate])

    const weekdays = locale === 'ne' ? BS_WEEKDAY_NAMES_NE_SHORT : BS_WEEKDAY_NAMES_EN_SHORT

    // Generate day cells
    const days = React.useMemo(() => {
        const list: { day: number; iso: string; obj: SimpleBsDate }[] = []
        for (let d = 1; d <= daysInMonth; d++) {
            const obj: SimpleBsDate = { year, month, day: d }
            list.push({
                day: d,
                iso: formatBsDate(obj),
                obj,
            })
        }
        return list
    }, [year, month, daysInMonth])

    return (
        <div className="nc-month-panel">
            {/* Weekday headers */}
            <div className="nc-weekdays">
                {weekdays.map((name, i) => {
                    const isSaturday = i === 6
                    return (
                        <div
                            key={i}
                            className={`nc-weekday ${isSaturday ? 'is-weekend' : ''}`}
                        >
                            {name}
                        </div>
                    )
                })}
            </div>

            {/* Days grid */}
            <div
                className="nc-days-grid"
                onMouseLeave={() => onHoverDay?.(null)}
            >
                {/* Empty cells before month start */}
                {Array.from({ length: firstWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} className="nc-day-empty" />
                ))}

                {/* Day cells */}
                {days.map(({ day, iso, obj }) => {
                    const isToday =
                        today.year === year && today.month === month && today.day === day

                    const isSingleSelected = selectedDate === iso
                    const isRangeStart = rangeStart === iso
                    const isRangeEnd = rangeEnd === iso
                    const isRangeEndpoint = isRangeStart || isRangeEnd

                    // Range selection check
                    let isInRange = false
                    if (rangeStart && rangeEnd) {
                        isInRange = iso > rangeStart && iso < rangeEnd
                    }

                    // Hover preview check (when start is selected but end isn't yet)
                    let isRangePreview = false
                    if (rangeStart && !rangeEnd && hoverDate) {
                        const min = rangeStart < hoverDate ? rangeStart : hoverDate
                        const max = rangeStart < hoverDate ? hoverDate : rangeStart
                        isRangePreview = (iso > min && iso < max) || (iso === hoverDate && iso !== rangeStart)
                    }

                    // Disabled check
                    let isDisabled = false
                    if (minDateObj && compareBsDates(obj, minDateObj) < 0) {
                        isDisabled = true
                    }
                    if (maxDateObj && compareBsDates(obj, maxDateObj) > 0) {
                        isDisabled = true
                    }

                    const adDay = showAdEquivalent ? getAdDayForBs(year, month, day) : null
                    const dayDisplay = locale === 'ne' ? toNepaliNumerals(day) : day

                    let cellClass = 'nc-day-cell'
                    if (isDisabled) cellClass += ' is-disabled'
                    if (isToday) cellClass += ' is-today'
                    if (isSingleSelected) cellClass += ' is-selected'
                    if (isRangeEndpoint) cellClass += ' is-range-endpoint'
                    if (isRangeStart) cellClass += ' is-range-start'
                    if (isRangeEnd) cellClass += ' is-range-end'
                    if (isInRange) cellClass += ' is-in-range'
                    if (isRangePreview) cellClass += ' is-range-preview'

                    return (
                        <button
                            key={iso}
                            type="button"
                            className={cellClass}
                            disabled={isDisabled}
                            onClick={() => onSelectDay(iso)}
                            onMouseEnter={() => !isDisabled && onHoverDay?.(iso)}
                        >
                            <span className="nc-day-num">{dayDisplay}</span>
                            {adDay && <span className="nc-ad-badge">{adDay}</span>}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
