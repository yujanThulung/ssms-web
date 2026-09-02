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
  module: string
}

// One item per section — expand later as features are built
export const overview: SidebarItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, module: 'dashboard' },
]

export const people: SidebarItem[] = [
  { title: 'Students', url: '/students', icon: GraduationCap, module: 'student' },
]

export const accounts: SidebarItem[] = [
  { title: 'Fee Collection', url: '/accounts', icon: Wallet, module: 'account' },
]

export const masterSetup: SidebarItem[] = [
  { title: 'Permissions', url: '/permissions', icon: ShieldCheck, module: 'role' },
]

export const system: SidebarItem[] = [
  { title: 'Settings', url: '/settings', icon: Settings, module: 'settings' },
]
