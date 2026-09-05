import {
  LayoutDashboard,
  GraduationCap,
  Wallet,
  ShieldCheck,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SidebarItem = {
  title: string
  url: string
  icon: LucideIcon
  feature: string
  alwaysVisible?: boolean
}

// One item per section — expand later as features are built
export const overview: SidebarItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, feature: 'dashboard', alwaysVisible: true },
]

export const people: SidebarItem[] = [
  { title: 'Students', url: '/students', icon: GraduationCap, feature: 'student' },
]

export const accounts: SidebarItem[] = [
  { title: 'Fee Collection', url: '/accounts', icon: Wallet, feature: 'account' },
]

export const masterSetup: SidebarItem[] = [
  { title: 'Permissions', url: '/permissions', icon: ShieldCheck, feature: 'role' },
]

export const system: SidebarItem[] = [
  { title: 'Settings', url: '/settings', icon: Settings, feature: 'settings', alwaysVisible: true },
]


// Single source of truth for nav groups — used by both the sidebar and the
// header breadcrumb, so the two never drift apart.
export const sidebarGroups: { label: string; items: SidebarItem[] }[] = [
  { label: 'Overview', items: overview },
  { label: 'People', items: people },
  { label: 'Accounts', items: accounts },
  { label: 'Master Setup', items: masterSetup },
  { label: 'System', items: system },
]

/** Looks up { group, title } for a given pathname, for breadcrumbs. */
export function findNavEntry(pathname: string): { group: string; title: string } | null {
  for (const g of sidebarGroups) {
    const item = g.items.find((i) => i.url === pathname)
    if (item) return { group: g.label, title: item.title }
  }
  return null
}