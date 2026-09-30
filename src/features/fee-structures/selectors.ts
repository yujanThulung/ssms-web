import { useMemo } from 'react'
import type { ApiPaginatedResponse, ApiMeta } from '../../lib/api/types'
import { EMPTY_TOTALS } from './constants'
import type {
  FeeFrequency,
  FeeStructureFlatListItem,
  FeeStructureGroupedListItem,
  FeeStructureLine,
  FeeStructureListRow,
  FeeStructureListStructure,
  FeeStructureListWireItem,
  FeeStructureTotals,
  Money,
} from './types'

// ─── Primitives ───────────────────────────────────────────────────────────────

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function firstDefined<T>(...values: (T | null | undefined)[]): T | undefined {
  for (const value of values) {
    if (value !== null && value !== undefined) return value
  }
  return undefined
}

/**
 * Unwraps the many list payload envelopes the API uses (`[...]`,
 * `{ data: [...] }`, `{ data: { items: [...] } }`) so callers never have to
 * guess.
 */
export function toListArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (!payload || typeof payload !== 'object') return []

  const root = payload as Record<string, unknown>
  if (Array.isArray(root.data)) return root.data as T[]

  const nested = root.data
  if (nested && typeof nested === 'object' && Array.isArray((nested as Record<string, unknown>).items)) {
    return (nested as { items: T[] }).items
  }
  if (Array.isArray(root.items)) return root.items as T[]
  return []
}

export function extractMeta(payload: unknown): ApiMeta | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const meta = (payload as Record<string, unknown>).meta
  return meta && typeof meta === 'object' ? (meta as ApiMeta) : undefined
}

// ─── Totals ───────────────────────────────────────────────────────────────────

const FREQUENCY_KEY: Record<FeeFrequency, keyof FeeStructureTotals> = {
  MONTHLY: 'monthly',
  TERM: 'term',
  YEARLY: 'yearly',
  ONE_TIME: 'oneTime',
}

export function sumLineTotals(
  lines: readonly FeeStructureLine[] | null | undefined,
): FeeStructureTotals {
  if (!lines) return { ...EMPTY_TOTALS }

  const totals: FeeStructureTotals = { ...EMPTY_TOTALS }
  for (const line of lines) {
    const key = FREQUENCY_KEY[line?.frequency]
    if (!key) continue
    totals[key] += toNumber(line?.amount)
  }
  return totals
}

type WireTotalKey = 'monthlyTotal' | 'termTotal' | 'yearlyTotal' | 'oneTimeTotal'

function readTotals(
  primary: FeeStructureListStructure | null,
  fallback: FeeStructureGroupedListItem['aggregateTotals'],
  lines: readonly FeeStructureLine[] | null | undefined,
): FeeStructureTotals {
  const fromLines = lines ? sumLineTotals(lines) : null

  const resolve = (key: keyof FeeStructureTotals, wireKey: WireTotalKey): number => {
    const value = firstDefined<Money>(primary?.[wireKey], fallback?.[wireKey])
    return value != null ? toNumber(value) : (fromLines?.[key] ?? 0)
  }

  return {
    monthly: resolve('monthly', 'monthlyTotal'),
    term: resolve('term', 'termTotal'),
    yearly: resolve('yearly', 'yearlyTotal'),
    oneTime: resolve('oneTime', 'oneTimeTotal'),
  }
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function isFlatShape(item: FeeStructureListWireItem): item is FeeStructureFlatListItem {
  return 'structures' in item
    ? false
    : typeof (item as FeeStructureFlatListItem).id === 'string'
}

/**
 * Turns either wire shape into a single fully-guaranteed row.
 *
 * A class has exactly one fee structure, so the grouped shape's `structures`
 * array is reduced to its first entry — and to `null` when the class has none.
 * This is the fix for the `Cannot read properties of undefined (reading '0')`
 * crash: nothing in the UI ever indexes an optional array.
 */
export function toListRow(
  item: FeeStructureListWireItem,
  index = 0,
): FeeStructureListRow {
  const grouped = item as FeeStructureGroupedListItem
  const flat = item as FeeStructureFlatListItem

  const classRef = firstDefined(grouped.class, flat.class) ?? null
  const yearRef = firstDefined(grouped.academicYear, flat.academicYear) ?? null

  const classId = firstDefined(grouped.class?.id, flat.classId, classRef?.id) ?? ''
  const className = firstDefined(grouped.class?.name, classRef?.name) ?? 'Unnamed class'
  const academicYearId = firstDefined(grouped.academicYear?.id, flat.academicYearId) ?? ''
  const academicYearName = firstDefined(grouped.academicYear?.name, yearRef?.name) ?? '—'

  const structure: FeeStructureListStructure | null = isFlatShape(item)
    ? (item as FeeStructureListStructure)
    : (Array.isArray(grouped.structures) && grouped.structures.length > 0
        ? grouped.structures[0]
        : null)

  const lines = structure?.lines ?? null
  const totals = readTotals(structure, grouped.aggregateTotals, lines)

  const baseKey = `${academicYearId}:${classId}:${structure?.id ?? 'none'}`

  return {
    rowKey: `${baseKey}#${index}`,
    classId,
    className,
    classCode: classRef?.code ?? null,
    academicYearId,
    academicYearName,
    structure,
    status: structure?.status ?? null,
    lineCount: Array.isArray(lines) ? lines.length : 0,
    studentsAssigned: toNumber(structure?.studentsAssigned),
    totals,
    createdAt: structure?.createdAt ?? null,
  }
}

/** Normalises a list response, guaranteeing unique row keys. */
export function toListRows(items: readonly FeeStructureListWireItem[]): FeeStructureListRow[] {
  const seen = new Map<string, number>()

  return items.map((item, index) => {
    const row = toListRow(item, index)
    // The API can legitimately repeat a class (e.g. a stale structure row next
    // to the current one). Deduplicate the React key so React never warns.
    const count = seen.get(row.rowKey) ?? 0
    seen.set(row.rowKey, count + 1)
    return count === 0 ? row : { ...row, rowKey: `${row.rowKey}~${count}` }
  })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useFeeStructureRows(
  data: ApiPaginatedResponse<FeeStructureListWireItem> | undefined,
) {
  return useMemo(() => {
    const items = toListArray<FeeStructureListWireItem>(data)
    return { rows: toListRows(items), meta: extractMeta(data) }
  }, [data])
}

/** Totals grouped by frequency for a structure's own fee-head lines. */
export function useLinesTotals(lines: readonly FeeStructureLine[] | null | undefined) {
  return useMemo(() => sumLineTotals(lines), [lines])
}
