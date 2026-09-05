import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Layout, Breadcrumb, Input, Badge, Popover, Dropdown, Avatar, Modal } from 'antd'
import type { MenuProps } from 'antd'
import { toast } from 'sonner'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Check,
  CheckCheck,
  User,
  Settings,
  KeyRound,
  LogOut,
} from 'lucide-react'
import { findNavEntry } from './sidebarItems'
import { useAuth } from '../context/AuthContext'
import { colors } from '../lib/designTokens'

const { Header } = Layout

// Dummy data — replace with a real notifications API when the backend is ready.
const initialNotifications = [
  { id: '1', title: 'Fee reminder sent', body: '42 guardians notified about upcoming due dates', time: '2h ago', read: false },
  { id: '2', title: 'Payment received', body: 'Aarav Thapa paid NPR 15,000 for Term 2', time: '5h ago', read: false },
  { id: '3', title: 'Invoice generated', body: 'Monthly invoices generated for Grade 8', time: '1d ago', read: true },
]

function NotificationBell() {
  const [items, setItems] = useState(initialNotifications)
  const unread = items.filter((i) => !i.read).length

  const content = (
    <div style={{ width: 340 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 4px',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>Notifications</p>
          <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>{unread} unread</p>
        </div>
        <button
          onClick={() => {
            setItems((x) => x.map((i) => ({ ...i, read: true })))
            toast.success('All notifications marked as read')
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            color: colors.secondaryText,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <CheckCheck size={14} /> Mark all
        </button>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {items.map((n) => (
          <div
            key={n.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 8,
              padding: '10px 4px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: n.read ? 'transparent' : colors.primaryLight,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: colors.text }}>{n.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>{n.body}</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: colors.disabled }}>{n.time}</p>
            </div>
            {!n.read && (
              <button
                aria-label="Mark as read"
                onClick={() => setItems((x) => x.map((i) => (i.id === n.id ? { ...i, read: true } : i)))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.muted, height: 'fit-content' }}
              >
                <Check size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Popover content={content} trigger="click" placement="bottomRight">
      <button
        aria-label="Notifications"
        style={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          width: 36,
          height: 36,
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        <Badge count={unread} size="small" offset={[-2, 2]}>
          <Bell size={18} color={colors.secondaryText} />
        </Badge>
      </button>
    </Popover>
  )
}

function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.fullName || user?.username || 'User'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

  const handleLogout = () => {
    Modal.confirm({
      title: 'Are you sure you want to logout?',
      content: 'You will be signed out of the school management system on this device.',
      okText: 'Logout',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: () => {
        logout()
        toast.success('Logged out successfully')
        navigate('/login')
      },
    })
  }

  const items: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', minWidth: 200 }}>
          <Avatar style={{ backgroundColor: colors.primaryLight, color: colors.primary, fontWeight: 600 }}>
            {initials}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.text }}>{displayName}</p>
            <p style={{ margin: 0, fontSize: 12, color: colors.muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </p>
            {user?.role?.name && (
              <span style={{ fontSize: 11, color: colors.primary, fontWeight: 600 }}>
                {user.role.name.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'profile',
      label: 'Profile',
      icon: <User size={14} />,
      onClick: () => navigate('/settings'),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <Settings size={14} />,
      onClick: () => navigate('/settings'),
    },
    {
      key: 'password',
      label: 'Change password',
      icon: <KeyRound size={14} />,
      onClick: () => toast.info('Password change form opened in Settings → Security'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: <span style={{ color: colors.error }}>Logout</span>,
      icon: <LogOut size={14} color={colors.error} />,
      onClick: handleLogout,
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: '50%',
          lineHeight: 0,
        }}
      >
        <Avatar style={{ backgroundColor: colors.primaryLight, color: colors.primary, fontWeight: 600 }}>
          {initials}
        </Avatar>
      </button>
    </Dropdown>
  )
}

export default function AppHeader({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
  const { pathname } = useLocation()
  const entry = findNavEntry(pathname)

  const breadcrumbItems = entry
    ? [{ title: entry.group }, { title: entry.title }]
    : [{ title: 'Overview' }, { title: 'Dashboard' }]

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 12,
        height: 64,
        padding: '0 24px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(6px)',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: colors.secondaryText,
          }}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div style={{ width: 1, height: 20, backgroundColor: colors.border }} />
        <Breadcrumb items={breadcrumbItems} style={{ fontSize: 13 }} />
      </div>

      <div className="hidden md:block" style={{ maxWidth: 380, margin: '0 auto', width: '100%' }}>
        <Input
          prefix={<Search size={14} color={colors.disabled} />}
          placeholder="Search students, invoices, vendors…"
          style={{ borderRadius: 8 }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifySelf: 'end' }}>
        <NotificationBell />
        <ProfileMenu />
      </div>
    </Header>
  )
}