import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Layout, Breadcrumb, Input, Dropdown, Avatar, AutoComplete, Spin, Tag } from 'antd'
import type { InputRef, MenuProps } from 'antd'
import { useQuery } from '@tanstack/react-query'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  User,
  Settings,
  KeyRound,
  LogOut,
  FileText,
  ChevronDown,
} from 'lucide-react'
import { findNavEntry } from './sidebarItems'
import { useAuth } from '../context/AuthContext'
import { useLogOut } from '../features/auth/hooks/useLogout'
import { colors } from '../lib/designTokens'
import client from '../lib/api/client'
import { ENDPOINTS } from '../lib/api/endpoints'
import { formatMoney } from '../features/fee-structures'
import type { Student } from '../pages/students/types'
import type { Invoice } from '../features/invoices'
import { usePermission } from '../context/PermissionContext'
import { FEATURES, ACTIONS } from '../utils/permissions'
import { appConfirm } from '../components/common/AppConfirm'

const { Header } = Layout

function GlobalSearch() {
  const navigate = useNavigate()
  const inputRef = useRef<InputRef>(null)
  const { can } = usePermission()
  const canSearchStudents = can(FEATURES.STUDENT, ACTIONS.VIEW)
  const canSearchInvoices = can(FEATURES.INVOICE, ACTIONS.VIEW)
  const canOpenFeeProfile = can(FEATURES.FEE_PROFILE, ACTIONS.VIEW)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', debouncedQuery, canSearchStudents, canSearchInvoices],
    enabled: debouncedQuery.length >= 2 && (canSearchStudents || canSearchInvoices),
    retry: false,
    queryFn: async () => {
      const [students, invoices] = await Promise.all([
        canSearchStudents
          ? client.get(ENDPOINTS.STUDENTS.BASE, { params: { search: debouncedQuery, page: 1, limit: 5 } })
              .then((response) => {
                const body = response.data as { data?: { items?: Student[] } }
                return body?.data?.items ?? []
              })
          : Promise.resolve([] as Student[]),
        canSearchInvoices
          ? client.get(ENDPOINTS.INVOICES.BASE, { params: { search: debouncedQuery, page: 1, limit: 5 } })
              .then((response) => {
                const body = response.data as { data?: Invoice[] }
                return body?.data ?? []
              })
          : Promise.resolve([] as Invoice[]),
      ])
      return { students, invoices }
    },
  })

  const groupedOptions = useMemo(() => {
    const studentOptions = (data?.students ?? []).map((student: Student) => {
      const name = student.fullName || [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')
      const initial = name.slice(0, 2).toUpperCase()
      const rollNumber = student.currentEnrollment?.rollNumber || student.enrollment?.rollNumber
      return {
        value: `student:${student.id}`,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar
                size={30}
                src={student.photoUrl ?? undefined}
                style={{
                  backgroundColor: colors.primaryLight,
                  color: colors.primary,
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {!student.photoUrl ? initial : undefined}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 13, color: colors.text }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, color: colors.muted, display: 'flex', gap: 8 }}>
                  <span>Adm: {student.admissionNumber}</span>
                  {rollNumber && <span>· Roll: {rollNumber}</span>}
                </div>
              </div>
            </div>
            <Tag color="blue" style={{ margin: 0, fontSize: 11, borderRadius: 4, flexShrink: 0 }}>Student</Tag>
          </div>
        ),
      }
    })

    const invoiceOptions = (data?.invoices ?? []).map((invoice: Invoice) => ({
      value: `invoice:${invoice.id}`,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                color: colors.muted,
              }}
            >
              <FileText size={15} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 13, color: colors.text }}>
                {invoice.invoiceNumber}
              </div>
              <div style={{ fontSize: 11, color: colors.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {invoice.student?.name || 'Student'} {invoice.billingPeriod ? `· ${invoice.billingPeriod}` : ''}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <Tag
              color={invoice.status === 'PAID' ? 'green' : invoice.status === 'OVERDUE' ? 'red' : 'blue'}
              style={{ margin: 0, fontSize: 11, borderRadius: 4 }}
            >
              {invoice.status.replaceAll('_', ' ')}
            </Tag>
            <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{formatMoney(invoice.outstandingAmount)} due</div>
          </div>
        </div>
      ),
    }))

    const groups: Array<{ label: React.ReactNode; options: Array<{ value: string; label: React.ReactNode }> }> = []
    if (studentOptions.length > 0) {
      groups.push({
        label: (
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 4px' }}>
            Students ({studentOptions.length})
          </div>
        ),
        options: studentOptions,
      })
    }
    if (invoiceOptions.length > 0) {
      groups.push({
        label: (
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 4px' }}>
            Invoices ({invoiceOptions.length})
          </div>
        ),
        options: invoiceOptions,
      })
    }
    return groups
  }, [data])

  const handleSelect = (value: string) => {
    const separator = value.indexOf(':')
    const kind = value.slice(0, separator)
    const id = value.slice(separator + 1)
    if (kind === 'invoice') navigate(`/accounts/invoices/${id}`)
    if (kind === 'student') navigate(canOpenFeeProfile ? `/accounts/fee-profiles/${id}` : `/students/${id}`)
    setQuery('')
    setDebouncedQuery('')
    setFocused(false)
    inputRef.current?.blur()
  }

  const searchEnabled = canSearchStudents || canSearchInvoices
  const dropdownOpen = focused && debouncedQuery.length >= 2

  const suffix = isFetching ? (
    <Spin size="small" />
  ) : !query ? (
    <kbd
      style={{
        fontSize: 10,
        fontFamily: 'inherit',
        padding: '2px 5px',
        borderRadius: 4,
        background: '#f1f5f9',
        border: '1px solid #cbd5e1',
        color: '#64748b',
        lineHeight: 1,
        pointerEvents: 'none',
      }}
    >
      {isMac ? '⌘K' : 'Ctrl K'}
    </kbd>
  ) : null

  return (
    <AutoComplete
      value={query}
      options={groupedOptions}
      open={dropdownOpen}
      onChange={setQuery}
      onSelect={handleSelect}
      style={{ width: '100%' }}
      popupMatchSelectWidth
      notFoundContent={
        isFetching ? (
          <div style={{ padding: '16px 12px', textAlign: 'center', color: colors.muted, fontSize: 13 }}>
            <Spin size="small" style={{ marginRight: 8 }} />
            <span>Searching...</span>
          </div>
        ) : debouncedQuery.length >= 2 ? (
          <div style={{ padding: '16px 12px', textAlign: 'center', color: colors.muted, fontSize: 13 }}>
            No students or invoices found for "{debouncedQuery}"
          </div>
        ) : null
      }
      filterOption={false}
    >
      <Input
        ref={inputRef}
        prefix={<Search size={15} style={{ color: colors.muted, marginRight: 6, flexShrink: 0 }} />}
        suffix={suffix}
        placeholder={searchEnabled ? 'Search students or invoices…' : 'Search unavailable'}
        disabled={!searchEnabled}
        allowClear
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setTimeout(() => setFocused(false), 200)
        }}
        onPressEnter={() => {
          const first = groupedOptions[0]?.options?.[0]
          if (first) handleSelect(first.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setQuery('')
            setFocused(false)
            inputRef.current?.blur()
          }
        }}
        style={{
          height: 38,
          borderRadius: 8,
          backgroundColor: focused ? '#ffffff' : '#f8fafc',
          border: `1px solid ${focused ? colors.primary : '#e2e8f0'}`,
          boxShadow: focused ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
          fontSize: 13,
          transition: 'all 0.15s ease',
        }}
      />
    </AutoComplete>
  )
}

function ProfileMenu() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { mutate: doLogout, isPending: isLoggingOut } = useLogOut()

  const displayName = user?.fullName || user?.username || 'User'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

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
      onClick: () => navigate('/settings', { state: { tab: 'profile' } }),
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
      onClick: () => navigate('/settings', { state: { tab: 'profile' } }),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: <span style={{ color: colors.error }}>Logout</span>,
      icon: <LogOut size={14} color={colors.error} />,
      onClick: handleLogout,
    },
  ]

  const email = user?.email || ''

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid transparent',
          background: 'transparent',
          cursor: 'pointer',
          padding: '4px 8px 4px 4px',
          borderRadius: 8,
          transition: 'all 0.15s ease',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc'
          e.currentTarget.style.borderColor = '#e2e8f0'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
        }}
      >
        <Avatar
          size={36}
          style={{
            backgroundColor: colors.primaryLight,
            color: colors.primary,
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {initials}
        </Avatar>
        <div className="hidden sm:block" style={{ minWidth: 0, maxWidth: 170 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: colors.text,
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </p>
          {email && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: colors.muted,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {email}
            </p>
          )}
        </div>
        <ChevronDown size={13} style={{ color: colors.muted, flexShrink: 0 }} />
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

  const rawItems = entry
    ? [{ title: entry.group }, { title: entry.title }]
    : [{ title: 'Overview' }, { title: 'Dashboard' }]

  const breadcrumbItems = rawItems.map((item, index) => {
    const isLast = index === rawItems.length - 1
    return {
      title: isLast ? (
        <span style={{ color: colors.primary, fontWeight: 600 }}>{item.title}</span>
      ) : (
        item.title
      ),
    }
  })

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

      <div className="hidden md:block" style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
        <GlobalSearch />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifySelf: 'end' }}>
        <ProfileMenu />
      </div>
    </Header>
  )
}
