import React from 'react'

export interface BsDateRange {
    from?: string // YYYY-MM-DD (BS)
    to?: string   // YYYY-MM-DD (BS)
}

export type NepaliLocale = 'en' | 'ne'

export interface NepaliCalendarBaseProps {
    /** Color accent (hex or css color). Default is #16a34a (green) */
    primaryColor?: string
    /** Display locale ('en' for English text, 'ne' for Nepali/Devanagari text) */
    locale?: NepaliLocale
    /** Minimum selectable BS year (default: 2060) */
    minYear?: number
    /** Maximum selectable BS year (default: 2100) */
    maxYear?: number
    /** Minimum selectable BS date "YYYY-MM-DD" */
    minDate?: string
    /** Maximum selectable BS date "YYYY-MM-DD" */
    maxDate?: string
    /** Disabled state */
    disabled?: boolean
    /** Allow clearing the selection */
    allowClear?: boolean
    /** Custom z-index for the popover (default: 1200, renders above AntD drawer) */
    zIndex?: number
    /** Additional CSS class for container */
    className?: string
    /** Additional inline style for container */
    style?: React.CSSProperties
    /** Additional inline style for the floating popover */
    popoverStyle?: React.CSSProperties
    /** Placeholder text */
    placeholder?: string
    /** Show converted AD date alongside BS in trigger / info */
    showAdEquivalent?: boolean
}

export interface NepaliDatePickerProps extends NepaliCalendarBaseProps {
    /** Controlled BS date string "YYYY-MM-DD" */
    value?: string
    /** Initial BS date string */
    defaultValue?: string
    /** Change callback */
    onChange?: (val: string) => void
    /** Trigger input size */
    size?: 'small' | 'middle' | 'large'
}

export interface NepaliDateRangePickerProps extends Omit<NepaliCalendarBaseProps, 'placeholder'> {
    /** Controlled BS date range { from?: string; to?: string } */
    value?: BsDateRange
    /** Initial BS date range */
    defaultValue?: BsDateRange
    /** Change callback */
    onChange?: (range: BsDateRange) => void
    /** Number of months to show in the calendar popover (1 or 2, default: 2) */
    numberOfMonths?: 1 | 2
    /** Range placeholders */
    placeholder?: string | [string, string]
    /** Trigger input size */
    size?: 'small' | 'middle' | 'large'
}
