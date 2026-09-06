import { Card, Skeleton } from 'antd'

export function CardSkeleton() {
  return (
    <Card style={{ borderRadius: 12 }}>
      <Skeleton active avatar paragraph={{ rows: 3 }} />
    </Card>
  )
}
