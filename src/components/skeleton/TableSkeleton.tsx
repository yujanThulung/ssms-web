import { Table, Skeleton } from 'antd'

export interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 2 }: TableSkeletonProps) {
  const dummyColumns = Array.from({ length: columns }).map((_, colIndex) => ({
    title: <Skeleton.Input active size="small" style={{ width: 120 }} />,
    key: `col-${colIndex}`,
    render: () => <Skeleton.Input active size="small" style={{ width: colIndex === 0 ? '70%' : '40%' }} />,
  }))

  const dummyData = Array.from({ length: rows }).map((_, rowIndex) => ({
    key: `row-${rowIndex}`,
  }))

  return (
    <Table
      columns={dummyColumns}
      dataSource={dummyData}
      pagination={false}
      rowKey="key"
    />
  )
}
