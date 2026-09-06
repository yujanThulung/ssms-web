import { Skeleton, Space } from 'antd'

export interface ListSkeletonProps {
  count?: number
}

export function ListSkeleton({ count = 4 }: ListSkeletonProps) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton.Input active size="small" style={{ width: 160 }} />
            <Skeleton.Button active size="small" style={{ width: 80 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Skeleton.Input active size="small" style={{ width: '100%' }} />
            <Skeleton.Input active size="small" style={{ width: '100%' }} />
            <Skeleton.Input active size="small" style={{ width: '100%' }} />
          </div>
        </div>
      ))}
    </Space>
  )
}
