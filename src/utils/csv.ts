export type CsvCell = string | number | boolean | null | undefined

/** Quotes a cell only when it needs it, doubling any inner quotes. */
function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return /["\n,]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

/**
 * Downloads `rows` as a CSV file. Returns false when there is nothing to
 * export so callers can show a "nothing to export" toast.
 */
export function exportCsv(filename: string, headers: string[], rows: CsvCell[][]): boolean {
  if (rows.length === 0) return false

  const csv = [headers, ...rows].map((line) => line.map(escapeCell).join(',')).join('\r\n')
  // Leading BOM keeps Excel from mangling non-latin characters.
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}

/** `YYYY-MM-DD` for a date-ish value, or an em dash when empty. */
export function csvDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10)
}