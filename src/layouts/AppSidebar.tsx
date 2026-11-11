import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { LogOut } from 'lucide-react'
import { overview, people, accounts, masterSetup, system } from './sidebarItems'
import { usePermission } from '../context/PermissionContext'
import { ACTIONS, FEATURES } from '../utils/permissions'
import type { SidebarItem } from './sidebarItems'
import { useAcademicYears, type AcademicYear } from '../features/academic-years'
import { toListArray } from '../features/fee-structures'
import { useLogOut } from '../features/auth/hooks/useLogout'
import { appConfirm } from '../components/common/AppConfirm'
import logo from '../assets/logo.png'

const { Sider } = Layout

function pathMatches(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`)
}

type MenuItem = Required<MenuProps>['items'][number]

/** Returns the set of parent keys whose children contain the active path. */
function getOpenKeys(items: SidebarItem[], pathname: string): string[] {
  const keys: string[] = []
  for (const item of items) {
    if (item.children?.some((c) => pathMatches(pathname, c.url))) {
      keys.push(item.url)
    }
  }
  return keys
}

function buildMenuItems(
  items: SidebarItem[],
  pathname: string,
  can: (feature: string, action: string) => boolean,
): MenuItem[] {
  return items
    .filter((item) => {
      if (item.alwaysVisible) return true
      if (!item.feature) return false
      return can(item.feature, ACTIONS.VIEW)
    })
    .map((item) => {
      // ── item with sub-menu 
      if (item.children && item.children.length > 0) {
        const visibleChildren = item.children.filter((c) =>
          c.alwaysVisible ? true : can(c.feature, ACTIONS.VIEW),
        )
        const anyChildActive = visibleChildren.some((c) => pathMatches(pathname, c.url))
        return {
          key: item.url,
          icon: <item.icon size={16} color={anyChildActive ? '#15803d' : '#374151'} />,
          label: (
            <span style={{ fontWeight: anyChildActive ? 600 : 500, color: anyChildActive ? '#15803d' : '#111827' }}>
              {item.title}
            </span>
          ),
          children: visibleChildren.map((child) => {
            const active = pathMatches(pathname, child.url)
            return {
              key: child.url,
              icon: <child.icon size={14} color={active ? '#ffffff' : undefined} />,
              label: child.title,
              style: {
                borderRadius: 8,
                margin: '2px 0',
                fontWeight: active ? 600 : 400,
                backgroundColor: active ? '#16a34a' : undefined,
                color: active ? '#ffffff' : undefined,
                fontSize: 13,
              },
            }
          }),
        }
      }

      //  leaf item 
      const active = pathMatches(pathname, item.url)
      return {
        key: item.url,
        icon: <item.icon size={16} color={active ? '#ffffff' : undefined} />,
        label: item.title,
        style: {
          borderRadius: 8,
          margin: '2px 0',
          fontWeight: active ? 600 : 500,
          backgroundColor: active ? '#16a34a' : undefined,
          color: active ? '#ffffff' : undefined,
        },
      }
    })
}

function getGroupItems(
  label: string,
  items: SidebarItem[],
  pathname: string,
  can: (feature: string, action: string) => boolean,
): MenuItem[] {
  const children = buildMenuItems(items, pathname, can)
  if (children.length === 0) return []

  return [
    {
      type: 'group',
      key: `group-${label.toLowerCase().replace(/\s+/g, '-')}`,
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
      children,
    },
  ]
}

export default function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { can } = usePermission()
  const [yearHovered, setYearHovered] = useState(false)
  const [logoutHovered, setLogoutHovered] = useState(false)
  const { mutate: doLogout, isPending: isLoggingOut } = useLogOut()

  const canViewAcademicSession = can(FEATURES.ACADEMIC_YEAR, ACTIONS.VIEW)
  const { data: yearsData } = useAcademicYears({ limit: 10 })
  const currentYear = useMemo(() => {
    const list = toListArray<AcademicYear>(yearsData)
    return list.find((y) => y.status === 'CURRENT') ?? list[0]
  }, [yearsData])
  const yearLabel = currentYear?.name || '2025 – 2026'

  // Collect all items from every group to find which sub-menus should be open
  const allItems = [overview, people, accounts, masterSetup, system].flat()
  const defaultOpenKeys = getOpenKeys(allItems, pathname)

  const sectionConfigs = [
    { label: 'Overview', items: overview },
    { label: 'People', items: people },
    { label: 'Accounts', items: accounts },
    { label: 'Master Setup', items: masterSetup },
    { label: 'System', items: system },
  ]

  const items: MenuItem[] = []

  sectionConfigs.forEach((section, index) => {
    const menuItems = getGroupItems(section.label, section.items, pathname, can)
    if (menuItems.length > 0) {
      if (items.length > 0) {
        items.push({ type: 'divider', key: `divider-${index}` })
      }
      items.push(...menuItems)
    }
  })

  const handleAcademicYearClick = () => {
    if (canViewAcademicSession) {
      navigate('/academic-session')
    }
  }

  const handleLogout = () => {
    appConfirm({
      title: 'Are you sure you want to logout?',
      content: 'You will be signed out of the school management system on this device.',
      okText: isLoggingOut ? 'Logging out…' : 'Logout',
      okColor: 'danger',
      cancelText: 'Cancel',
      okButtonProps: {
        loading: isLoggingOut,
      },
      onOk: () => doLogout(),
    })
  }

  return (
    <Sider
      theme="light"
      collapsed={collapsed}
      collapsedWidth={80}
      width={260}
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        borderRight: '1px solid #f3f4f6',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
      trigger={null}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: collapsed ? '12px 0' : '12px 16px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid #f3f4f6',
          flexShrink: 0,
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

        {/* Scrollable Navigation Menu */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <Menu
            theme="light"
            mode="inline"
            className="sidebar-menu"
            selectedKeys={allItems.flatMap((item) => item.children ?? [item])
              .filter((item) => pathMatches(pathname, item.url))
              .sort((a, b) => b.url.length - a.url.length)
              .slice(0, 1)
              .map((item) => item.url)}
            defaultOpenKeys={defaultOpenKeys}
            inlineCollapsed={collapsed}
            onClick={({ key }) => navigate(key)}
            items={items}
            style={{
              border: 'none',
              padding: '8px 12px',
              backgroundColor: '#ffffff',
            }}
          />
        </div>

        {/* Footer Fixed at the End of Sidebar */}
        <div style={{
          flexShrink: 0,
          marginTop: 'auto',
          padding: collapsed ? '10px 8px' : '10px 14px',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#ffffff',
        }}>
          {collapsed ? (
            <Tooltip title={`Logout (${yearLabel})`} placement="right">
              <button
                onClick={handleLogout}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                style={{
                  position: 'relative',
                  width: 44,
                  height: 44,
                  margin: '0 auto',
                  borderRadius: 8,
                  backgroundColor: logoutHovered ? '#fee2e2' : '#fef2f2',
                  border: `1px solid ${logoutHovered ? '#fca5a5' : '#fecaca'}`,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: '#dc2626',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: logoutHovered ? '0 2px 8px rgba(220, 38, 38, 0.15)' : 'none',
                  overflow: 'hidden',
                }}
              >
                {/* Active Bar indicator on hover */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    backgroundColor: '#dc2626',
                    opacity: logoutHovered ? 1 : 0,
                    transform: logoutHovered ? 'scaleY(1)' : 'scaleY(0.4)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
                <LogOut size={18} />
              </button>
            </Tooltip>
          ) : (
            <div>
              {/* Academic Year Info Row */}
              <div
                onClick={handleAcademicYearClick}
                onMouseEnter={() => setYearHovered(true)}
                onMouseLeave={() => setYearHovered(false)}
                role={canViewAcademicSession ? 'button' : undefined}
                tabIndex={canViewAcademicSession ? 0 : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  marginBottom: 8,
                  borderRadius: 6,
                  cursor: canViewAcademicSession ? 'pointer' : 'default',
                  backgroundColor: yearHovered && canViewAcademicSession ? '#f0fdf4' : 'transparent',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#16a34a',
                      boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.2)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#15803d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    Academic Year
                  </span>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#14532d',
                  letterSpacing: '0.02em',
                }}>
                  {yearLabel}
                </span>
              </div>

              {/* Logout Button with Active Bar on Hover */}
              <button
                onClick={handleLogout}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 12px 9px 16px',
                  borderRadius: 8,
                  backgroundColor: logoutHovered ? '#fee2e2' : '#fef2f2',
                  border: `1px solid ${logoutHovered ? '#fca5a5' : '#fecaca'}`,
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: logoutHovered ? '0 2px 8px rgba(220, 38, 38, 0.12)' : 'none',
                  overflow: 'hidden',
                }}
              >
                {/* Active Bar indicator on hover */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: '#dc2626',
                    borderRadius: '4px 0 0 4px',
                    opacity: logoutHovered ? 1 : 0,
                    transform: logoutHovered ? 'scaleY(1)' : 'scaleY(0.3)',
                    transformOrigin: 'center',
                    transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />

                <LogOut
                  size={16}
                  style={{
                    color: '#dc2626',
                    flexShrink: 0,
                    transition: 'transform 0.2s ease',
                    transform: logoutHovered ? 'translateX(2px)' : 'none',
                  }}
                />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Sider>
  )
}
