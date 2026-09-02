import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import AppSidebar from './AppSidebar'

const { Content } = Layout

export default function DashboardLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout style={{ backgroundColor: '#f9fafb' }}>
        <Content style={{ overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
