import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CalendarHeader } from './CalendarHeader'
import { CalendarMonth } from './CalendarMonth'
import {
    parseBsDate,
    getTodayBsDate,
    addMonthsToView,
    calculateDaysBetween,
    formatBsDisplay,
    BS_MIN_YEAR,
    BS_MAX_YEAR,
} from './calendarUtils'
import type { NepaliDateRangePickerProps, BsDateRange } from './types'
import './nepaliCalendar.css'

export const NepaliDateRangePicker: React.FC<NepaliDateRangePickerProps> = ({
    value,
    defaultValue,
    onChange,
    primaryColor = '#16a34a',
    locale = 'en',
    minYear = BS_MIN_YEAR,
    maxYear = BS_MAX_YEAR,
    minDate,
    maxDate,
    disabled = false,
    allowClear = true,
    zIndex = 1200,
    className = '',
    style,
    popoverStyle,
    placeholder = 'Select BS date range',
    numberOfMonths = 2,
    size = 'middle',
    showAdEquivalent = false,
}) => {
    const isControlled = value !== undefined
    const [internalRange, setInternalRange] = useState<BsDateRange>(defaultValue || {})
    const activeRange = isControlled ? value || {} : internalRange

    const [isOpen, setIsOpen] = useState(false)
    const [hoverDate, setHoverDate] = useState<string | null>(null)
    const [tempStart, setTempStart] = useState<string | null>(null)

    // Current view month/year for left calendar
    const today = getTodayBsDate()
    const initialView = React.useMemo(() => {
        const fromDate = parseBsDate(activeRange.from)
        if (fromDate) return { year: fromDate.year, month: fromDate.month }
        return { year: today.year, month: today.month }
    }, [activeRange.from, today.year, today.month])

    const [leftView, setLeftView] = useState(initialView)

    // Sync view when opening if range exists
    useEffect(() => {
        if (isOpen && activeRange.from) {
            const parsed = parseBsDate(activeRange.from)
            if (parsed) {
                setLeftView({ year: parsed.year, month: parsed.month })
            }
        }
    }, [isOpen, activeRange.from])

    // Right calendar view is next month
    const rightView = React.useMemo(() => {
        return addMonthsToView(leftView.year, leftView.month, 1)
    }, [leftView])

    const triggerRef = useRef<HTMLDivElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)
    const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number }>({
        top: 0,
        left: 0,
    })

    const isDual = numberOfMonths === 2

    // Update position when opening
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        const popoverWidth = isDual ? 620 : 310
        let left = rect.left

        // Adjust if overflowing viewport right
        if (left + popoverWidth > window.innerWidth - 16) {
            left = Math.max(16, window.innerWidth - popoverWidth - 16)
        }

        // Adjust top if overflowing viewport bottom
        let top = rect.bottom + 6
        if (top + 400 > window.innerHeight && rect.top - 400 > 0) {
            top = rect.top - 400
        }

        setPopoverCoords({
            top: top + window.scrollY,
            left: left + window.scrollX,
        })
    }, [isDual])

    useEffect(() => {
        if (isOpen) {
            updatePosition()
            window.addEventListener('resize', updatePosition)
            window.addEventListener('scroll', updatePosition, true)
            return () => {
                window.removeEventListener('resize', updatePosition)
                window.removeEventListener('scroll', updatePosition, true)
            }
        }
    }, [isOpen, updatePosition])

    // Click outside listener
    useEffect(() => {
        if (!isOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                triggerRef.current &&
                !triggerRef.current.contains(target) &&
                popoverRef.current &&
                !popoverRef.current.contains(target)
            ) {
                setIsOpen(false)
                setTempStart(null)
            }
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false)
                setTempStart(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen])

    const handleDayClick = (iso: string) => {
        if (!tempStart) {
            // First click sets start
            setTempStart(iso)
        } else {
            // Second click completes range
            let from = tempStart
            let to = iso
            if (from > to) {
                const temp = from
                from = to
                to = temp
            }
            const nextRange = { from, to }
            if (!isControlled) {
                setInternalRange(nextRange)
            }
            onChange?.(nextRange)
            setTempStart(null)
            setIsOpen(false)
        }
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        const emptyRange = { from: undefined, to: undefined }
        if (!isControlled) {
            setInternalRange(emptyRange)
        }
        onChange?.(emptyRange)
        setTempStart(null)
    }

    const handleClearFrom = (e: React.MouseEvent) => {
        e.stopPropagation()
        const next = { from: undefined, to: activeRange.to }
        if (!isControlled) setInternalRange(next)
        onChange?.(next)
        setTempStart(null)
    }

    const handleClearTo = (e: React.MouseEvent) => {
        e.stopPropagation()
        const next = { from: activeRange.from, to: undefined }
        if (!isControlled) setInternalRange(next)
        onChange?.(next)
        setTempStart(null)
    }

    const handleSelectCurrentYear = () => {
        const from = `${today.year}-01-01`
        const to = `${today.year}-12-30`
        const nextRange = { from, to }
        if (!isControlled) {
            setInternalRange(nextRange)
        }
        onChange?.(nextRange)
        setTempStart(null)
        setIsOpen(false)
    }

    const handleTodayClick = () => {
        setLeftView({ year: today.year, month: today.month })
    }

    const durationDays = React.useMemo(() => {
        if (activeRange.from && activeRange.to) {
            return calculateDaysBetween(activeRange.from, activeRange.to)
        }
        return 0
    }, [activeRange.from, activeRange.to])

    const activeRangeStart = tempStart || activeRange.from
    const activeRangeEnd = tempStart ? undefined : activeRange.to

    // Build theme vars — primary-light is a 12%-opacity tint of the primary color.
    const primaryLight = CSS.supports('color', 'color-mix(in srgb, red 10%, transparent)')
        ? `color-mix(in srgb, ${primaryColor} 12%, transparent)`
        : `${primaryColor}1f`
    const customThemeVars = {
        '--nc-primary': primaryColor,
        '--nc-primary-hover': primaryColor,
        '--nc-primary-light': primaryLight,
    } as React.CSSProperties

    return (
        <div
            className={`nc-container ${className}`}
            style={{ ...customThemeVars, ...style }}
        >
            {/* Trigger — dual input field style */}
            <div
                ref={triggerRef}
                className={`nc-range-trigger nc-trigger-size-${size} ${isOpen ? 'is-open' : ''} ${
                    disabled ? 'is-disabled' : ''
                }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {/* Start field */}
                <div
                    className={`nc-range-field ${
                        isOpen && !tempStart ? 'is-active' : ''
                    }`}
                >
                    <span className="nc-range-field-label">
                        {Array.isArray(placeholder) ? placeholder[0] : (locale === 'ne' ? 'सुरु मिति' : 'Start date')}
                    </span>
                    <div className="nc-range-field-row">
                        <span className={tempStart || activeRange.from ? 'nc-range-field-value' : 'nc-range-field-placeholder'}>
                            {tempStart
                                ? formatBsDisplay(tempStart, locale)
                                : activeRange.from
                                    ? formatBsDisplay(activeRange.from, locale)
                                    : (locale === 'ne' ? 'मिति छान्नुहोस्' : 'Select date')
                            }
                        </span>
                        {allowClear && (tempStart || activeRange.from) && !disabled && (
                            <button
                                type="button"
                                className="nc-field-clear-btn"
                                title={locale === 'ne' ? 'सुरु मिति मेटाउनुहोस्' : 'Clear start date'}
                                onClick={tempStart ? (e) => { e.stopPropagation(); setTempStart(null) } : handleClearFrom}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Separator */}
                <span className="nc-range-sep">→</span>

                {/* End field */}
                <div
                    className={`nc-range-field ${
                        isOpen && tempStart ? 'is-active' : ''
                    }`}
                >
                    <span className="nc-range-field-label">
                        {Array.isArray(placeholder) ? placeholder[1] : (locale === 'ne' ? 'अन्तिम मिति' : 'End date')}
                    </span>
                    <div className="nc-range-field-row">
                        <span className={activeRange.to && !tempStart ? 'nc-range-field-value' : 'nc-range-field-placeholder'}>
                            {activeRange.to && !tempStart
                                ? formatBsDisplay(activeRange.to, locale)
                                : (locale === 'ne' ? 'मिति छान्नुहोस्' : 'Select date')
                            }
                        </span>
                        {allowClear && activeRange.to && !tempStart && !disabled && (
                            <button
                                type="button"
                                className="nc-field-clear-btn"
                                title={locale === 'ne' ? 'अन्तिम मिति मेटाउनुहोस्' : 'Clear end date'}
                                onClick={handleClearTo}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Popover */}
            {isOpen &&
                createPortal(
                    <div
                        ref={popoverRef}
                        className="nc-popover"
                        style={{
                            top: popoverCoords.top,
                            left: popoverCoords.left,
                            zIndex,
                            width: isDual ? 620 : 310,
                            ...customThemeVars,
                            ...popoverStyle,
                        }}
                    >
                        <div className="nc-months-wrapper">
                            {/* Left Month Panel */}
                            <div className="nc-month-panel">
                                <CalendarHeader
                                    year={leftView.year}
                                    month={leftView.month}
                                    minYear={minYear}
                                    maxYear={maxYear}
                                    locale={locale}
                                    onChangeYear={(y) => setLeftView((prev) => ({ ...prev, year: y }))}
                                    onChangeMonth={(m) => setLeftView((prev) => ({ ...prev, month: m }))}
                                    onPrevYear={() =>
                                        setLeftView((prev) => ({ ...prev, year: prev.year - 1 }))
                                    }
                                    onPrevMonth={() =>
                                        setLeftView((prev) => addMonthsToView(prev.year, prev.month, -1))
                                    }
                                    onNextMonth={() =>
                                        setLeftView((prev) => addMonthsToView(prev.year, prev.month, 1))
                                    }
                                    onNextYear={() =>
                                        setLeftView((prev) => ({ ...prev, year: prev.year + 1 }))
                                    }
                                    showMonthNav={true}
                                    showYearNav={true}
                                />
                                <CalendarMonth
                                    year={leftView.year}
                                    month={leftView.month}
                                    locale={locale}
                                    rangeStart={activeRangeStart}
                                    rangeEnd={activeRangeEnd}
                                    hoverDate={hoverDate || undefined}
                                    minDate={minDate}
                                    maxDate={maxDate}
                                    showAdEquivalent={showAdEquivalent}
                                    onSelectDay={handleDayClick}
                                    onHoverDay={setHoverDate}
                                />
                            </div>

                            {/* Separator Line & Right Month Panel (when showing dual calendar) */}
                            {isDual && (
                                <>
                                    <div className="nc-calendar-divider" />
                                    <div className="nc-month-panel">
                                        <CalendarHeader
                                            year={rightView.year}
                                            month={rightView.month}
                                            minYear={minYear}
                                            maxYear={maxYear}
                                            locale={locale}
                                            onChangeYear={(y) =>
                                                setLeftView(addMonthsToView(y, rightView.month, -1))
                                            }
                                            onChangeMonth={(m) =>
                                                setLeftView(addMonthsToView(rightView.year, m, -1))
                                            }
                                            onPrevYear={() =>
                                                setLeftView((prev) => ({ ...prev, year: prev.year - 1 }))
                                            }
                                            onPrevMonth={() =>
                                                setLeftView((prev) => addMonthsToView(prev.year, prev.month, -1))
                                            }
                                            onNextMonth={() =>
                                                setLeftView((prev) => addMonthsToView(prev.year, prev.month, 1))
                                            }
                                            onNextYear={() =>
                                                setLeftView((prev) => ({ ...prev, year: prev.year + 1 }))
                                            }
                                            showMonthNav={true}
                                            showYearNav={true}
                                        />
                                        <CalendarMonth
                                            year={rightView.year}
                                            month={rightView.month}
                                            locale={locale}
                                            rangeStart={activeRangeStart}
                                            rangeEnd={activeRangeEnd}
                                            hoverDate={hoverDate || undefined}
                                            minDate={minDate}
                                            maxDate={maxDate}
                                            showAdEquivalent={showAdEquivalent}
                                            onSelectDay={handleDayClick}
                                            onHoverDay={setHoverDate}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer: Keep only Today & Year Selection */}
                        <div className="nc-footer">
                            <div className="nc-footer-meta">
                                {tempStart ? (
                                    <span>{locale === 'ne' ? 'अन्तिम मिति छान्नुहोस्' : 'Select end date'}</span>
                                ) : activeRange.from && activeRange.to ? (
                                    <span>
                                        {formatBsDisplay(activeRange.from, locale)} →{' '}
                                        {formatBsDisplay(activeRange.to, locale)}{' '}
                                        {durationDays > 0 && `(${durationDays} ${locale === 'ne' ? 'दिन' : 'days'})`}
                                    </span>
                                ) : (
                                    <span>{locale === 'ne' ? 'सुरु मिति छान्नुहोस्' : 'Select start date'}</span>
                                )}
                            </div>

                            <div className="nc-footer-actions">
                                <button
                                    type="button"
                                    className="nc-action-btn"
                                    onClick={handleTodayClick}
                                >
                                    {locale === 'ne' ? 'आज' : 'Today'}
                                </button>
                                <button
                                    type="button"
                                    className="nc-action-btn"
                                    onClick={handleSelectCurrentYear}
                                >
                                    {locale === 'ne' ? `पूरा वर्ष ${today.year}` : `Full Year ${today.year}`}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    )
}
