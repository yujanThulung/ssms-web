import {
  LayoutDashboard,
  GraduationCap,
  Wallet,
  ShieldCheck,
  Settings,
  Users,
  CalendarRange,
  BookOpen,
  List,
  ArrowUpCircle,
  Tags,
  Percent,
  Award,
  ReceiptText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { FEATURES } from '../utils'

export type SidebarItem = {
  title: string
  url: string
  icon: LucideIcon
  feature: string
  alwaysVisible?: boolean
  children?: SidebarItem[]
}

// One item per section — expand later as features are built
export const overview: SidebarItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, feature: 'dashboard', alwaysVisible: true },
]

export const people: SidebarItem[] = [
  {
    title: 'Students',
    url: '/students-group',
    icon: GraduationCap,
    feature: FEATURES.STUDENT,
    alwaysVisible: true,
    children: [
      { title: 'All Students', url: '/students', icon: List, feature: FEATURES.STUDENT, alwaysVisible: true },
      { title: 'Promote Students', url: '/students/promote', icon: ArrowUpCircle, feature: FEATURES.STUDENT, alwaysVisible: true },
    ],
  },
  { title: 'Users', url: '/users', icon: Users, feature: FEATURES.USER },
]

export const accounts: SidebarItem[] = [
  { title: 'Fee Collection', url: '/accounts', icon: Wallet, feature: FEATURES.ACCOUNT },
  { title: 'Fee Profiles', url: '/accounts/fee-profiles', icon: ReceiptText, feature: FEATURES.FEE_PROFILE },
  { title: 'Program Assignments', url: '/accounts/program-assignments', icon: Award, feature: FEATURES.PROGRAM_ASSIGNMENT },
  // Discounts and Scholarships live in one screen behind tabs — see FeeStructurePage.
  { title: 'Discounts & Scholarships', url: '/discounts', icon: Percent, feature: FEATURES.DISCOUNT_SCHOLARSHIP },
]

export const masterSetup: SidebarItem[] = [
  { title: 'Academic Session', url: '/academic-session', icon: CalendarRange, feature: FEATURES.ACADEMIC_YEAR },
  { title: 'Classes & Sections', url: '/classes', icon: BookOpen, feature: FEATURES.CLASS_SECTION },
  { title: 'Fee Categories', url: '/fee-categories', icon: Tags, feature: FEATURES.FEE_CATEGORY },
  { title: 'Fee Structure', url: '/fee-structures', icon: List, feature: FEATURES.FEE_STRUCTURE },
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
  let nestedGroup: string | null = null
  let nestedTitle: string | null = null
  let nestedLength = 0

  for (const g of sidebarGroups) {
    for (const item of g.items) {
      if (item.url === pathname) return { group: g.label, title: item.title }

      if (item.children) {
        const child = item.children.find((c) => c.url === pathname)
        if (child) return { group: g.label, title: child.title }

        for (const candidate of item.children) {
          if (
            candidate.url !== '/' &&
            pathname.startsWith(`${candidate.url}/`) &&
            candidate.url.length > nestedLength
          ) {
            nestedGroup = g.label
            nestedTitle = candidate.title
            nestedLength = candidate.url.length
          }
        }
      }

      if (
        item.url !== '/' &&
        pathname.startsWith(`${item.url}/`) &&
        item.url.length > nestedLength
      ) {
        nestedGroup = g.label
        nestedTitle = item.title
        nestedLength = item.url.length
      }
    }
  }

  return nestedGroup && nestedTitle ? { group: nestedGroup, title: nestedTitle } : null
}
