import { useMemo, useState } from 'react'
import { Table, Drawer, Checkbox, Input, Space, Tag, Dropdown, Modal, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MoreOutlined, EyeOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { toast } from 'sonner'
import {
  usePermission,
  ROLES,
  roleMeta,
  permissionModules,
  type RoleName,
  type PermissionSet,
} from '../../context/PermissionContext'
import { DRAWER, colors } from '../../lib/designTokens'

type RoleRow = { role: RoleName }

export default function PermissionsPage() {
  const { permissions, setRolePermissions, can } = usePermission()
  const canEdit = can('role', 'UPDATE')
  const [viewRole, setViewRole] = useState<RoleName | null>(null)

  const rows: RoleRow[] = ROLES.map((role) => ({ role }))

  const columns: ColumnsType<RoleRow> = [
    {
      title: 'Role',
      key: 'role',
      render: (_, r) => {
        const meta = roleMeta[r.role]
        return (
          <Space>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: colors.text }}>
                {r.role.replace('_', ' ')}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>{meta.description}</p>
            </div>
            <Tag>{meta.users} users</Tag>
            {meta.system ? <Tag color="blue">System</Tag> : null}
          </Space>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, r) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'view',
                label: 'View',
                icon: <EyeOutlined />,
                onClick: () => setViewRole(r.role),
              },
              {
                key: 'delete',
                label: 'Delete',
                icon: <DeleteOutlined />,
                danger: true,
                disabled: roleMeta[r.role].system,
                onClick: () => {
                  Modal.confirm({
                    title: `Delete role "${r.role.replace('_', ' ')}"?`,
                    content:
                      'Users assigned to this role will lose their current access. This cannot be undone.',
                    okText: 'Delete',
                    okButtonProps: { danger: true },
                    onOk: () => toast.success(`${r.role.replace('_', ' ')} role deleted`),
                  })
                },
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: colors.text }}>Permissions</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.muted }}>
          Roles and their access across every module of the system
        </p>
      </div>

      <Table
        rowKey="role"
        columns={columns}
        dataSource={rows}
        pagination={false}
        onRow={(r) => ({ onClick: () => setViewRole(r.role), style: { cursor: 'pointer' } })}
      />

      {viewRole && (
        <RolePermissionsDrawer
          role={viewRole}
          permissionSet={permissions[viewRole]}
          canEdit={canEdit}
          onClose={() => setViewRole(null)}
          onSave={(p) => {
            setRolePermissions(viewRole, p)
            toast.success(`${viewRole.replace('_', ' ')} permissions updated`)
            setViewRole(null)
          }}
        />
      )}
    </div>
  )
}

function RolePermissionsDrawer({
  role,
  permissionSet,
  canEdit,
  onClose,
  onSave,
}: {
  role: RoleName
  permissionSet: PermissionSet
  canEdit: boolean
  onClose: () => void
  onSave: (p: PermissionSet) => void
}) {
  const [draft, setDraft] = useState<PermissionSet>(() =>
    Object.fromEntries(Object.entries(permissionSet).map(([k, v]) => [k, [...v]])),
  )
  const [query, setQuery] = useState('')

  const filteredModules = useMemo(
    () =>
      permissionModules.filter(
        (m) =>
          m.label.toLowerCase().includes(query.toLowerCase()) ||
          m.group.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  const toggleAction = (moduleKey: string, action: string, checked: boolean) => {
    setDraft((prev) => {
      const current = new Set(prev[moduleKey] ?? [])
      if (checked) current.add(action)
      else current.delete(action)
      return { ...prev, [moduleKey]: Array.from(current) }
    })
  }

  const toggleAll = (moduleKey: string, actions: string[], checked: boolean) => {
    setDraft((prev) => ({ ...prev, [moduleKey]: checked ? [...actions] : [] }))
  }

  return (
    <Drawer
      title={`${role.replace('_', ' ')} permissions`}
      open
      onClose={onClose}
      width={DRAWER.widthXl}
      extra={
        canEdit ? (
          <Button
            type="primary"
            onClick={() => onSave(draft)}
            style={{ background: colors.primary, borderColor: colors.primary }}
          >
            Save changes
          </Button>
        ) : null
      }
    >
      <p style={{ marginTop: -8, color: colors.muted, fontSize: 13 }}>{roleMeta[role].description}</p>
      <Input
        allowClear
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search modules…"
        prefix={<SearchOutlined style={{ color: colors.muted }} />}
        style={{ marginBottom: 16 }}
      />

      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {filteredModules.map((m) => {
          const checkedActions = new Set(draft[m.key] ?? [])
          const allChecked = m.actions.every((a) => checkedActions.has(a))
          return (
            <div key={m.key} style={{ border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: colors.text }}>
                    {m.label}
                    {m.alwaysVisible && (
                      <Tag style={{ marginLeft: 8 }} color="default">
                        Always visible
                      </Tag>
                    )}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>{m.group}</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: colors.muted }}>
                  <Checkbox
                    checked={allChecked}
                    disabled={!canEdit}
                    onChange={(e) => toggleAll(m.key, m.actions, e.target.checked)}
                  />
                  Select all
                </label>
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 8,
                }}
              >
                {m.actions.map((action) => (
                  <label key={action} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Checkbox
                      checked={checkedActions.has(action)}
                      disabled={!canEdit}
                      onChange={(e) => toggleAction(m.key, action, e.target.checked)}
                    />
                    {action}
                  </label>
                ))}
              </div>
            </div>
          )
        })}
        {filteredModules.length === 0 && (
          <p style={{ padding: '40px 0', textAlign: 'center', color: colors.muted, fontSize: 13 }}>
            No modules match your search.
          </p>
        )}
      </Space>
    </Drawer>
  )
}