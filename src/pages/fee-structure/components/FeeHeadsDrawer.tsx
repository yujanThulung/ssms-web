import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Drawer,
  Empty,
  InputNumber,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons'
import { toast } from 'sonner'

import { colors, DRAWER, radius, sizing } from '../../../lib/designTokens'
import type { FeeCategory } from '../../../features/fee-categories'
import {
  FEE_FREQUENCY_OPTIONS,
  formatMoney,
  sumLineTotals,
  toNumber,
  useAddFeeStructureLine,
  useRemoveFeeStructureLine,
  useUpdateFeeStructureLine,
} from '../../../features/fee-structures'
import type { FeeFrequency, FeeStructureLine } from '../../../features/fee-structures'

const { Text } = Typography

let rowSeq = 0
const nextRowKey = () => `new-${++rowSeq}`

interface EditorRow {
  key: string
  /** `null` for a newly added row that has not been POSTed yet. */
  id: string | null
  feeCategoryId: string | undefined
  amount: number
  frequency: FeeFrequency
  originalAmount: number
  originalFrequency: FeeFrequency
}

export interface FeeHeadsDrawerProps {
  structureId: string
  lines: FeeStructureLine[]
  categories: FeeCategory[]
  onClose: () => void
}

function buildRows(lines: FeeStructureLine[]): EditorRow[] {
  return lines.map((line) => ({
    key: line.id,
    id: line.id,
    feeCategoryId: line.feeCategoryId,
    amount: toNumber(line.amount),
    frequency: line.frequency,
    originalAmount: toNumber(line.amount),
    originalFrequency: line.frequency,
  }))
}

const isBlank = (row: EditorRow) => !row.feeCategoryId && row.amount === 0

/**
 * Full-screen editor for a draft's fee heads.
 *
 * The API has no "replace all lines" endpoint, so saving diffs the local table
 * against what the server returned and issues only the calls that are actually
 * needed: PATCH for edited rows, POST for new ones, DELETE for removed ones.
 */
export function FeeHeadsDrawer({
  structureId,
  lines,
  categories,
  onClose,
}: FeeHeadsDrawerProps) {
  const [rows, setRows] = useState<EditorRow[]>(() => buildRows(lines))
  const [saving, setSaving] = useState(false)

  const { mutateAsync: addLine } = useAddFeeStructureLine(structureId)
  const { mutateAsync: updateLine } = useUpdateFeeStructureLine()
  const { mutateAsync: removeLine } = useRemoveFeeStructureLine(structureId)

  const totals = useMemo(
    () =>
      sumLineTotals(
        rows
          .filter((row) => row.feeCategoryId)
          .map((row) => ({
            id: row.key,
            createdAt: '',
            updatedAt: '',
            feeStructureId: structureId,
            feeCategoryId: row.feeCategoryId as string,
            amount: row.amount,
            frequency: row.frequency,
          })),
      ),
    [rows, structureId],
  )

  const updateRow = (key: string, patch: Partial<EditorRow>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        key: nextRowKey(),
        id: null,
        feeCategoryId: undefined,
        amount: 0,
        frequency: 'MONTHLY',
        originalAmount: 0,
        originalFrequency: 'MONTHLY',
      },
    ])
  }

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key))
  }

  const restoreRow = (line: FeeStructureLine) => {
    setRows((prev) => [
      ...prev,
      {
        key: line.id,
        id: line.id,
        feeCategoryId: line.feeCategoryId,
        amount: toNumber(line.amount),
        frequency: line.frequency,
        originalAmount: toNumber(line.amount),
        originalFrequency: line.frequency,
      },
    ])
  }

  const removedRows = useMemo(
    () => lines.filter((line) => !rows.some((row) => row.id === line.id)),
    [lines, rows],
  )

  const changedRows = rows.filter(
    (row) => row.id && (row.amount !== row.originalAmount || row.frequency !== row.originalFrequency),
  )
  const addedRows = rows.filter((row) => !row.id && !isBlank(row))

  const hasChanges =
    changedRows.length > 0 || addedRows.length > 0 || removedRows.length > 0

  const handleSave = async () => {
    const payload = rows.filter((row) => row.feeCategoryId)

    if (payload.length !== rows.filter((row) => !isBlank(row)).length) {
      toast.error('Every fee head row needs a fee head selected.')
      return
    }
    if (payload.some((row) => row.amount < 0)) {
      toast.error('Amounts cannot be negative.')
      return
    }

    const seen = new Set<string>()
    const duplicate = payload.find((row) => {
      const id = row.feeCategoryId as string
      if (seen.has(id)) return true
      seen.add(id)
      return false
    })
    if (duplicate) {
      const name = categories.find((c) => c.id === duplicate.feeCategoryId)?.name
      toast.error(`"${name ?? 'A fee head'}" is listed more than once.`)
      return
    }
    if (payload.length === 0) {
      toast.error('Add at least one fee head before saving.')
      return
    }

    setSaving(true)
    try {
      for (const line of removedRows) await removeLine(line.id)
      for (const row of changedRows) {
        await updateLine({
          structureId,
          lineId: row.id as string,
          amount: String(row.amount),
          frequency: row.frequency,
        })
      }
      for (const row of addedRows) {
        await addLine({
          feeCategoryId: row.feeCategoryId as string,
          amount: String(row.amount),
          frequency: row.frequency,
        })
      }

      toast.success(
        [
          addedRows.length && `${addedRows.length} added`,
          changedRows.length && `${changedRows.length} updated`,
          removedRows.length && `${removedRows.length} removed`,
        ]
          .filter(Boolean)
          .join(' · ') || 'Fee heads saved',
      )
      onClose()
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Failed to save fee heads')
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<EditorRow> = [
    {
      title: 'Fee Head',
      key: 'feeCategoryId',
      width: 260,
      render: (_, row) => {
        const usedElsewhere = rows
          .filter((other) => other.key !== row.key)
          .map((other) => other.feeCategoryId)
        return (
          <Select
            style={{ width: '100%' }}
            placeholder="Select fee head"
            value={row.feeCategoryId}
            showSearch
            optionFilterProp="label"
            options={categories.map((category) => ({
              value: category.id,
              label: `${category.name} · ${category.frequency.replace('_', ' ').toLowerCase()}`,
              disabled: usedElsewhere.includes(category.id),
            }))}
            onChange={(value) => {
              const category = categories.find((c) => c.id === value)
              updateRow(row.key, {
                feeCategoryId: value,
                frequency: category?.frequency ?? row.frequency,
                amount:
                  row.id && row.amount === row.originalAmount
                    ? toNumber(category?.defaultAmount ?? row.amount)
                    : row.amount,
              })
            }}
          />
        )
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 160,
      render: (_, row) => (
        <InputNumber
          min={0}
          precision={2}
          style={{ width: '100%' }}
          addonBefore="Rs."
          value={row.amount}
          onChange={(value) => updateRow(row.key, { amount: value ?? 0 })}
        />
      ),
    },
    {
      title: 'Frequency',
      key: 'frequency',
      width: 160,
      render: (_, row) => (
        <Select
          style={{ width: '100%' }}
          value={row.frequency}
          options={FEE_FREQUENCY_OPTIONS}
          onChange={(value) => updateRow(row.key, { frequency: value })}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      align: 'center',
      render: (_, row) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          disabled={rows.length === 1 && !isBlank(row)}
          onClick={() => removeRow(row.key)}
          style={{ borderRadius: radius.sm }}
        />
      ),
    },
  ]

  return (
    <Drawer
      open
      onClose={onClose}
      size={DRAWER.widthLg}
      title={
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>Fee Heads</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Add, edit and remove fee heads. Frequency drives how often the charge is billed.
          </Text>
        </div>
      }
      extra={
        <Space>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            type="primary"
            loading={saving}
            disabled={!hasChanges}
            onClick={handleSave}
            style={{ background: colors.primary }}
          >
            Save Fee Heads
          </Button>
        </Space>
      }
      styles={{ body: { padding: 20 } }}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {hasChanges
            ? `${addedRows.length} to add · ${changedRows.length} to update · ${removedRows.length} to remove`
            : 'No unsaved changes'}
        </Text>
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            overflow: 'hidden',
          }}
        >
          <Table<EditorRow>
            rowKey="key"
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 640 }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No fee heads yet" /> }}
          />
          <div style={{ padding: 12, borderTop: `1px solid ${colors.border}` }}>
            <Button
              icon={<PlusOutlined />}
              onClick={addRow}
              style={{ height: sizing.controlHeightSm }}
            >
              Add Fee Head
            </Button>
          </div>
        </div>

        {/* Removed rows — recoverable until saved */}
        {removedRows.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={
              <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                <Text style={{ fontSize: 13 }}>
                  {removedRows.length} fee head{removedRows.length === 1 ? '' : 's'} will be removed on save
                </Text>
                <Space size={8} wrap>
                  {removedRows.map((line) => (
                    <Button
                      key={line.id}
                      size="small"
                      icon={<UndoOutlined />}
                      onClick={() => restoreRow(line)}
                    >
                      {line.feeCategory?.name ?? 'Restore'}
                    </Button>
                  ))}
                </Space>
              </Space>
            }
          />
        )}

        {/* Totals */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
            padding: 16,
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
          }}
        >
          <Statistic
            title="Monthly"
            value={totals.monthly}
            prefix="Rs."
            precision={2}
            valueStyle={{ fontSize: 18, fontWeight: 700 }}
          />
          <Statistic
            title="Per Term"
            value={totals.term}
            prefix="Rs."
            precision={2}
            valueStyle={{ fontSize: 18, fontWeight: 700 }}
          />
          <Statistic
            title="Yearly"
            value={totals.yearly}
            prefix="Rs."
            precision={2}
            valueStyle={{ fontSize: 18, fontWeight: 700 }}
          />
          <Statistic
            title="One Time"
            value={totals.oneTime}
            prefix="Rs."
            precision={2}
            valueStyle={{ fontSize: 18, fontWeight: 700 }}
          />
        </div>

        <Text type="secondary" style={{ fontSize: 12 }}>
          Totals above are a preview of the draft. {formatMoney(totals.monthly)} is billed every
          month, {formatMoney(totals.yearly)} once a year.
        </Text>
      </Space>
    </Drawer>
  )
}
