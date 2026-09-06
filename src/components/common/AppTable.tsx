import { Table, type TableProps } from 'antd'
import { colors } from '../../lib/designTokens'

export interface AppTableProps<RecordType extends object> extends TableProps<RecordType> {
  onRowClick?: (record: RecordType, event: React.MouseEvent<HTMLElement>) => void
}

export function AppTable<RecordType extends object = Record<string, unknown>>({
  onRowClick,
  onRow,
  style,
  className,
  ...props
}: AppTableProps<RecordType>) {
  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        ...style,
      }}
      className={className}
    >
      <Table<RecordType>
        {...props}
        onRow={(record, rowIndex) => {
          const userRowProps = onRow ? onRow(record, rowIndex) : {}
          return {
            ...userRowProps,
            onClick: (e) => {
              if (userRowProps.onClick) {
                userRowProps.onClick(e)
              }
              if (onRowClick) {
                onRowClick(record, e)
              }
            },
            style: {
              cursor: onRowClick ? 'pointer' : undefined,
              ...userRowProps.style,
            },
          }
        }}
      />
    </div>
  )
}
