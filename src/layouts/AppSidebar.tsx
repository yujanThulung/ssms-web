import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import { overview, people, accounts, masterSetup, system } from './sidebarItems'
import { usePermission } from '../context/PermissionContext'
import type { SidebarItem } from './sidebarItems'
import logo from '../assets/logo.png'

const { Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

function getItems(
  label: string,
  items: SidebarItem[],
  pathname: string,
  can: (feature: string, action: string) => boolean,
  role: string,
): MenuItem[] {
  const visible = items.filter((i) => {
    if (i.module === 'dashboard' || i.module === 'settings') return true
    if (i.module === 'role' && role !== 'SUPER_ADMIN' && i.url === '/permissions') return false
    return can(i.module, 'VIEW')
  })

  console.log(`[${label}] visible items:`, visible)

  if (visible.length === 0) return []

  return [
    {
      type: 'group',
      label: (
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: '#9ca3af',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      ),
      children: visible.map((item) => {
        const active = pathname === item.url
        return {
          key: item.url,
          icon: <item.icon size={16} color={active ? '#ffffff' : '#374151'} />,
          label: item.title,
          style: {
            borderRadius: 8,
            margin: '2px 0',
            fontWeight: active ? 600 : 500,
            backgroundColor: active ? '#16a34a' : 'transparent',
            color: active ? '#ffffff' : '#111827',
          },
        }
      }),
    },
  ]
}

export default function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { can, role } = usePermission()

  const items: MenuItem[] = [
    ...getItems('Overview', overview, pathname, can, role),
    { type: 'divider' },
    ...getItems('People', people, pathname, can, role),
    { type: 'divider' },
    ...getItems('Accounts', accounts, pathname, can, role),
    { type: 'divider' },
    ...getItems('Master Setup', masterSetup, pathname, can, role),
    { type: 'divider' },
    ...getItems('System', system, pathname, can, role),
  ]

  console.log('final menu items:', items)

  return (
    <Sider
      theme="light"
      collapsed={collapsed}
      collapsedWidth={80}
      width={240}
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRight: '1px solid #f3f4f6',
        backgroundColor: '#ffffff',
        overflow: 'auto',
      }}
      trigger={null}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: collapsed ? '12px 0' : '12px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid #f3f4f6',
      }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: 8,
          backgroundColor: '#15803d',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}>
          {/* <Landmark size={16} color="#ffffff" /> */}
          <img src={logo} alt="Logo" style={{ width: 50, height: 50 }} />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
              Salyansthan Secondary School
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
              School Management
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[pathname]}
        inlineCollapsed={collapsed}
        onClick={({ key }) => navigate(key)}
        items={items}
        style={{
          border: 'none',
          padding: '8px 12px',
          backgroundColor: '#ffffff',
        }}
      />

      {/* Footer */}
      {!collapsed && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px 12px',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#ffffff',
        }}>
          <div style={{ borderRadius: 8, backgroundColor: '#f0fdf4', padding: '8px 12px' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Academic Year
            </p>
            <p style={{ margin: 0, marginTop: 2, fontSize: 14, fontWeight: 700, color: '#14532d' }}>
              2025 – 2026
            </p>
          </div>
        </div>
      )}
    </Sider>
  )
}