import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CalendarHeader } from './CalendarHeader'
import { CalendarMonth } from './CalendarMonth'
import {
    parseBsDate,
    getTodayBsDate,
    addMonthsToView,
    formatBsDisplay,
    formatBsDate,
    BS_MIN_YEAR,
    BS_MAX_YEAR,
} from './calendarUtils'
import type { NepaliDatePickerProps } from './types'
import './nepaliCalendar.css'

export const NepaliDatePicker: React.FC<NepaliDatePickerProps> = ({
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
    placeholder = 'Select BS date',
    size = 'middle',
    showAdEquivalent = false,
}) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = useState<string>(defaultValue || '')
    const activeValue = isControlled ? value || '' : internalValue

    const [isOpen, setIsOpen] = useState(false)
    const today = getTodayBsDate()

    const initialView = React.useMemo(() => {
        const parsed = parseBsDate(activeValue)
        if (parsed) return { year: parsed.year, month: parsed.month }
        return { year: today.year, month: today.month }
    }, [activeValue, today.year, today.month])

    const [view, setView] = useState(initialView)

    useEffect(() => {
        if (isOpen && activeValue) {
            const parsed = parseBsDate(activeValue)
            if (parsed) {
                setView({ year: parsed.year, month: parsed.month })
            }
        }
    }, [isOpen, activeValue])

    const triggerRef = useRef<HTMLDivElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)
    const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number }>({
        top: 0,
        left: 0,
    })

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        const popoverWidth = 310
        let left = rect.left

        if (left + popoverWidth > window.innerWidth - 16) {
            left = Math.max(16, window.innerWidth - popoverWidth - 16)
        }

        let top = rect.bottom + 6
        if (top + 380 > window.innerHeight && rect.top - 380 > 0) {
            top = rect.top - 380
        }

        setPopoverCoords({
            top: top + window.scrollY,
            left: left + window.scrollX,
        })
    }, [])

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
            }
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false)
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
        if (!isControlled) {
            setInternalValue(iso)
        }
        onChange?.(iso)
        setIsOpen(false)
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!isControlled) {
            setInternalValue('')
        }
        onChange?.('')
    }

    const handleTodayClick = () => {
        const todayIso = formatBsDate(today)
        if (!isControlled) {
            setInternalValue(todayIso)
        }
        onChange?.(todayIso)
        setView({ year: today.year, month: today.month })
        setIsOpen(false)
    }

    const displayLabel = React.useMemo(() => {
        if (!activeValue) return ''
        return activeValue
    }, [activeValue])

    // Build theme vars — primary-light is a 12%-opacity tint of the primary color.
    // We use color-mix when the browser supports it; otherwise we inline a hex+alpha fallback.
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
            {/* Trigger Input */}
            <div
                ref={triggerRef}
                className={`nc-trigger nc-trigger-size-${size} ${isOpen ? 'is-open' : ''} ${
                    disabled ? 'is-disabled' : ''
                }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="nc-trigger-content">
                    {displayLabel ? (
                        <span className="nc-trigger-value">
                            {formatBsDisplay(displayLabel, locale)}
                        </span>
                    ) : (
                        <span className="nc-trigger-placeholder">
                            {placeholder || (locale === 'ne' ? 'मिति छान्नुहोस्' : 'Select BS date')}
                        </span>
                    )}
                </div>

                <div className="nc-trigger-actions">
                    {allowClear && activeValue && !disabled && (
                        <button
                            type="button"
                            className="nc-clear-btn"
                            title="Clear date"
                            onClick={handleClear}
                        >
                            ✕
                        </button>
                    )}
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
                            width: 310,
                            ...customThemeVars,
                            ...popoverStyle,
                        }}
                    >
                        <div className="nc-month-panel">
                            <CalendarHeader
                                year={view.year}
                                month={view.month}
                                minYear={minYear}
                                maxYear={maxYear}
                                locale={locale}
                                onChangeYear={(y) => setView((prev) => ({ ...prev, year: y }))}
                                onChangeMonth={(m) => setView((prev) => ({ ...prev, month: m }))}
                                onPrevYear={() => setView((prev) => ({ ...prev, year: prev.year - 1 }))}
                                onPrevMonth={() => setView((prev) => addMonthsToView(prev.year, prev.month, -1))}
                                onNextMonth={() => setView((prev) => addMonthsToView(prev.year, prev.month, 1))}
                                onNextYear={() => setView((prev) => ({ ...prev, year: prev.year + 1 }))}
                                showMonthNav={true}
                                showYearNav={true}
                            />
                            <CalendarMonth
                                year={view.year}
                                month={view.month}
                                locale={locale}
                                selectedDate={activeValue}
                                minDate={minDate}
                                maxDate={maxDate}
                                showAdEquivalent={showAdEquivalent}
                                onSelectDay={handleDayClick}
                            />
                        </div>

                        {/* Footer */}
                        <div className="nc-footer">
                            <div className="nc-footer-meta">
                                {activeValue ? (
                                    <span>{formatBsDisplay(activeValue, locale)}</span>
                                ) : (
                                    <span>{locale === 'ne' ? 'मिति छान्नुहोस्' : 'Select a date'}</span>
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
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    )
}
