import { useEffect, useRef } from 'react'
import { DatePicker, Select, Button } from 'antd'
import type { Dayjs } from 'dayjs'
import type { ReactNode } from 'react'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { colors, sizing } from '../../lib/designTokens'

// ─── Column definition ────────────────────────────────────────────────────────

export interface FilterOption {
  label: string
  value: string
}

export interface SmartColumn {
  key: string
  title: string
  isSearchable?: boolean
  isFilterable?: boolean
  filterOptions?: FilterOption[]
  filterWidth?: number
  isDateRange?: boolean
  dateRangeWidth?: number
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SearchAndFilterProps {
  columns: SmartColumn[]
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  debounceMs?: number
  filterValues?: Record<string, string | undefined>
  onFilterChange?: (key: string, value: string | undefined) => void
  dateValues?: Record<string, [Dayjs | null, Dayjs | null] | null>
  onDateChange?: (
    key: string,
    range: [Dayjs | null, Dayjs | null] | null,
  ) => void
  extra?: ReactNode
  style?: React.CSSProperties
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchAndFilter({
  columns,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  debounceMs = 300,
  filterValues = {},
  onFilterChange,
  dateValues = {},
  onDateChange,
  extra,
  style,
}: SearchAndFilterProps) {
  // ── Search placeholder ──────────────────────────────────────────────────

  const searchableTitles = columns
    .filter((c) => c.isSearchable)
    .map((c) => c.title)

  const resolvedPlaceholder =
    searchPlaceholder ??
    (searchableTitles.length > 0
      ? `Search by ${searchableTitles.join(', ')}…`
      : 'Search…')

  const filterableCols = columns.filter((c) => c.isFilterable)
  const dateRangeCols = columns.filter((c) => c.isDateRange)

  // ── Debounced search ─────────────────────────────────────────────────────

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== searchValue) {
      inputRef.current.value = searchValue
    }
  }, [searchValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value

    if (debounceMs === 0) {
      onSearchChange(val)
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      onSearchChange(val)
    }, debounceMs)
  }

  const handleClearSearch = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    onSearchChange('')
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  const hasActive =
    Boolean(searchValue) ||
    Object.values(filterValues).some(Boolean) ||
    Object.values(dateValues).some(Boolean)

  const handleReset = () => {
    handleClearSearch()

    filterableCols.forEach((c) => {
      onFilterChange?.(c.key, undefined)
    })

    dateRangeCols.forEach((c) => {
      onDateChange?.(c.key, null)
    })
  }

  // ─────────────────────────────────────────────────────────────────────────

  const HEIGHT = sizing.controlHeight || 36

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',

        width: '100%',
        minHeight: 70,

        marginBottom: 16,
        padding: 16,

        backgroundColor: colors.surface,

        border: `1px solid ${colors.border}`,
        borderRadius: 10,

        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',

        gap: 8,

        flexWrap: 'wrap',

        boxSizing: 'border-box',

        ...style,
      }}
    >
      {/* ── Search ───────────────────────────────────────────────────────── */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',

          height: HEIGHT,

          flex: '1 1 280px',
          minWidth: 240,

          padding: '0 11px',

          backgroundColor: colors.surface,

          border: `1px solid ${colors.border}`,
          borderRadius: 7,

          boxSizing: 'border-box',

          transition: 'border-color 0.2s ease',
        }}
      >
        <SearchOutlined
          style={{
            color: colors.muted,
            fontSize: 14,
            marginRight: 7,
            flexShrink: 0,
          }}
        />

        <input
          ref={inputRef}
          defaultValue={searchValue}
          onChange={handleInputChange}
          placeholder={resolvedPlaceholder}
          style={{
            width: '100%',

            border: 'none',
            outline: 'none',

            background: 'transparent',

            fontSize: 13,
            fontWeight: 400,

            color: colors.text,

            flex: 1,
            minWidth: 0,

            padding: 0,
          }}
        />

        {searchValue && (
          <button
            onClick={handleClearSearch}
            aria-label="Clear search"
            style={{
              border: 'none',
              background: 'transparent',

              cursor: 'pointer',

              padding: 0,
              marginLeft: 6,

              color: colors.muted,

              fontSize: 11,

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Select filters ───────────────────────────────────────────────── */}

      {filterableCols.map((col) => (
        <Select
          key={col.key}
          allowClear
          placeholder={col.title}
          value={filterValues[col.key] ?? undefined}
          onChange={(value) =>
            onFilterChange?.(col.key, value)
          }
          style={{
            width: col.filterWidth ?? 150,
            height: HEIGHT,
            flexShrink: 0,
          }}
          options={col.filterOptions ?? []}
          popupMatchSelectWidth={false}
          variant="outlined"
        />
      ))}

      {/* ── Date range ──────────────────────────────────────────────────── */}

      {dateRangeCols.map((col) => (
        <DatePicker.RangePicker
          key={col.key}
          value={dateValues[col.key] ?? null}
          onChange={(range) =>
            onDateChange?.(col.key, range)
          }
          placeholder={['Start date', 'End date']}
          style={{
            width: col.dateRangeWidth ?? 300,
            height: HEIGHT,

            flexShrink: 0,

            borderRadius: 7,
          }}
          variant="outlined"
        />
      ))}

      {/* ── Extra ────────────────────────────────────────────────────────── */}

      {extra && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: HEIGHT,

            flexShrink: 0,
          }}
        >
          {extra}
        </div>
      )}

      {/* ── Reset ────────────────────────────────────────────────────────── */}

      <Button
        icon={<ReloadOutlined />}
        onClick={handleReset}
        disabled={!hasActive}
        style={{
          height: HEIGHT,

          paddingInline: 14,

          borderRadius: 7,

          border: `1px solid ${hasActive
              ? colors.borderStrong
              : colors.border
            }`,

          backgroundColor: colors.surface,

          color: hasActive
            ? colors.text
            : colors.disabled,

          fontSize: 13,
          fontWeight: 500,

          boxShadow: 'none',

          flexShrink: 0,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,

          transition:
            'border-color 0.2s ease, background-color 0.2s ease',
        }}
      >
        Reset
      </Button>
    </div>
  )
}