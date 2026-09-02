import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'

const { Content } = Layout

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar collapsed={collapsed} />
      <Layout style={{ backgroundColor: '#f9fafb' }}>
        <AppHeader collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
        <Content style={{ overflow: 'auto', padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}