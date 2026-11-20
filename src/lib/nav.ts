/**
 * Primary navigation, data-driven so later phases add entries here instead
 * of editing Sidebar markup. Each role-prefixed area (`/app`, `/admin`,
 * `/developer`) has its OWN independent item list — a USER never sees an
 * Admin/Developer link and vice versa, because each area is a literal URL
 * prefix gated by its own `+layout.server.ts` guard (see
 * `src/lib/server/permissions/guards.ts`'s `requireArea`). This list only
 * decides what renders in the sidebar; it is never itself a security
 * boundary.
 *
 * Only routes that actually exist today are listed. Do not add an entry
 * here until its route is actually built — a nav link to a non-existent
 * page is a dead button.
 */
import {
	LayoutDashboard,
	UserRound,
	Gift,
	History,
	CalendarDays,
	Bell,
	Megaphone,
	Users,
	Building2,
	Briefcase,
	ClipboardList,
	ShieldCheck,
	BarChart3,
	ScrollText,
	Flag,
	Activity,
	KeyRound,
	Database,
	type Icon as LucideIcon
} from 'lucide-svelte';

export interface NavItem {
	/** A SvelteKit route ID (not a pathname) — resolve this with `resolve()` from `$app/paths`. */
	routeId:
		| '/app/dashboard'
		| '/app/profile'
		| '/app/benefits'
		| '/app/benefits/history'
		| '/app/leave'
		| '/app/notifications'
		| '/app/announcements'
		| '/admin/dashboard'
		| '/admin/employees'
		| '/admin/departments'
		| '/admin/positions'
		| '/admin/benefits'
		| '/admin/benefit-requests'
		| '/admin/leave-requests'
		| '/admin/leave-types'
		| '/admin/users'
		| '/admin/announcements'
		| '/admin/reports'
		| '/admin/audit-logs'
		| '/developer/dashboard'
		| '/developer/feature-flags'
		| '/developer/system-events'
		| '/developer/database'
		| '/developer/sessions'
		| '/developer/audit-logs';
	labelKey: string;
	icon: typeof LucideIcon;
}

export const APP_NAV_ITEMS: NavItem[] = [
	{ routeId: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
	{ routeId: '/app/benefits', labelKey: 'nav.benefits', icon: Gift },
	{ routeId: '/app/benefits/history', labelKey: 'nav.benefitsHistory', icon: History },
	{ routeId: '/app/leave', labelKey: 'nav.leave', icon: CalendarDays },
	{ routeId: '/app/notifications', labelKey: 'nav.notifications', icon: Bell },
	{ routeId: '/app/announcements', labelKey: 'nav.announcements', icon: Megaphone },
	{ routeId: '/app/profile', labelKey: 'nav.profile', icon: UserRound }
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
	{ routeId: '/admin/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
	{ routeId: '/admin/employees', labelKey: 'nav.employees', icon: Users },
	{ routeId: '/admin/departments', labelKey: 'nav.departments', icon: Building2 },
	{ routeId: '/admin/positions', labelKey: 'nav.positions', icon: Briefcase },
	{ routeId: '/admin/benefits', labelKey: 'nav.benefitCatalog', icon: Gift },
	{ routeId: '/admin/benefit-requests', labelKey: 'nav.benefitRequestsAdmin', icon: ClipboardList },
	{ routeId: '/admin/leave-requests', labelKey: 'nav.leaveRequestsAdmin', icon: CalendarDays },
	{ routeId: '/admin/leave-types', labelKey: 'nav.leaveTypesAdmin', icon: History },
	{ routeId: '/admin/users', labelKey: 'nav.users', icon: ShieldCheck },
	{ routeId: '/admin/announcements', labelKey: 'nav.announcementsAdmin', icon: Megaphone },
	{ routeId: '/admin/reports', labelKey: 'nav.reports', icon: BarChart3 },
	{ routeId: '/admin/audit-logs', labelKey: 'nav.auditLogs', icon: ScrollText }
];

export const DEVELOPER_NAV_ITEMS: NavItem[] = [
	{ routeId: '/developer/dashboard', labelKey: 'nav.devOverview', icon: LayoutDashboard },
	{ routeId: '/developer/feature-flags', labelKey: 'nav.featureFlags', icon: Flag },
	{ routeId: '/developer/database', labelKey: 'nav.database', icon: Database },
	{ routeId: '/developer/system-events', labelKey: 'nav.systemEvents', icon: Activity },
	{ routeId: '/developer/sessions', labelKey: 'nav.sessions', icon: KeyRound },
	{ routeId: '/developer/audit-logs', labelKey: 'nav.auditLogs', icon: ScrollText }
];
