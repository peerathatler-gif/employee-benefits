/**
 * Single source of truth for role capabilities.
 *
 * This module is shared between client and server (Sidebar needs it to
 * decide what to render; server guards need it to decide what to allow).
 * It only contains a static permission matrix — no secrets — so shipping
 * it to the browser is fine. It must never be used AS enforcement on the
 * client: actual authorization happens in `src/lib/server/permissions/
 * guards.ts`, which is server-only and is the only thing a request's
 * outcome may depend on.
 *
 * DEVELOPER is a technical-maintenance role (health/diagnostics/feature
 * flags) — it is NOT a super-admin and must never implicitly gain HR data
 * access (employees, benefits, leave). ADMIN is the HR/people-ops
 * administrative role. Every permission check in the app should go through
 * `can()` below rather than comparing `role` strings inline, so a future
 * change to what a role may do happens in exactly one place.
 */
import type { UserRole } from '../../generated/prisma/enums';

export type { UserRole };

export const ROLES = {
	USER: 'USER',
	DEVELOPER: 'DEVELOPER',
	ADMIN: 'ADMIN'
} as const satisfies Record<UserRole, UserRole>;

/**
 * Capabilities are named for the action they gate, not the role that
 * happens to have them today — that keeps call sites readable and makes a
 * future "give DEVELOPER read-only access to feature flag audit history"
 * change a one-line edit here instead of a search-and-replace.
 */
export const CAPABILITIES = {
	// HR data: own-employee self-service.
	VIEW_OWN_PROFILE: ['USER', 'DEVELOPER', 'ADMIN'],
	MANAGE_OWN_PASSWORD: ['USER', 'DEVELOPER', 'ADMIN'],

	// HR data: benefits & leave (future phases) — ADMIN only, by design.
	MANAGE_BENEFITS: ['ADMIN'],
	MANAGE_LEAVE: ['ADMIN'],
	REVIEW_CLAIMS: ['ADMIN'],
	MANAGE_ANNOUNCEMENTS: ['ADMIN'],
	MANAGE_EMPLOYEES: ['ADMIN'],

	// Technical/maintenance surface — DEVELOPER (and ADMIN, for break-glass).
	VIEW_SYSTEM_HEALTH: ['DEVELOPER', 'ADMIN'],
	MANAGE_FEATURE_FLAGS: ['DEVELOPER', 'ADMIN'],
	VIEW_AUDIT_LOG: ['DEVELOPER', 'ADMIN']
} as const satisfies Record<string, readonly UserRole[]>;

export type Capability = keyof typeof CAPABILITIES;

export function can(role: UserRole, capability: Capability): boolean {
	return (CAPABILITIES[capability] as readonly UserRole[]).includes(role);
}

export function isAdmin(role: UserRole): boolean {
	return role === ROLES.ADMIN;
}

export function isDeveloper(role: UserRole): boolean {
	return role === ROLES.DEVELOPER;
}

/**
 * Where a signed-in user's role-prefixed home area lives. Used by the
 * post-login redirect and by each area's `+layout.server.ts` guard to send
 * a signed-in user who hits the WRONG area back to their own, instead of a
 * 403 wall — see `src/lib/server/permissions/guards.ts`.
 */
export function roleHomePath(role: UserRole): string {
	switch (role) {
		case 'ADMIN':
			return '/admin/dashboard';
		case 'DEVELOPER':
			return '/developer/dashboard';
		default:
			return '/app/dashboard';
	}
}
