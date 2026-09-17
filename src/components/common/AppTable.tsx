import { Table, type TablePaginationConfig, type TableProps } from 'antd'
import { colors } from '../../lib/designTokens'

export interface AppTableProps<RecordType extends object> extends TableProps<RecordType> {
  onRowClick?: (record: RecordType, event: React.MouseEvent<HTMLElement>) => void
}

const DEFAULT_PAGINATION: TablePaginationConfig = {
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total: number) => `Total ${total} records`,
}

export function AppTable<RecordType extends object = Record<string, unknown>>({
  onRowClick,
  onRow,
  style,
  className,
  scroll,
  pagination,
  ...props
}: AppTableProps<RecordType>) {
  // Merge default pagination with any overrides — pass false to disable entirely
  const resolvedPagination =
    pagination === false
      ? false
      : { ...DEFAULT_PAGINATION, ...pagination }

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
      <style>{`
        .ant-table-wrapper .ant-table-pagination {
          padding: 12px 16px !important;
          margin: 0 !important;
        }
      `}</style>
      <Table<RecordType>
        scroll={{ x: 'max-content', ...scroll }}
        pagination={resolvedPagination}
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
