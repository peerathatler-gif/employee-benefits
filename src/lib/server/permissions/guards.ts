/**
 * Server-side authorization guards. These are the only functions that
 * should decide "is this request allowed to proceed" — never trust a
 * client-supplied role, and never infer authorization from what the UI
 * happens to render.
 */
import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { can, roleHomePath, type Capability, type UserRole } from '../../permissions/roles';

export interface AuthenticatedUser {
	id: string;
	email: string;
	role: 'USER' | 'DEVELOPER' | 'ADMIN';
	isActive: boolean;
}

/** Throws a redirect to /login when there is no authenticated user. */
export function requireUser(event: RequestEvent): AuthenticatedUser {
	const user = event.locals.user;
	if (!user) {
		const redirectTo = event.url.pathname + event.url.search;
		redirect(303, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	return user;
}

/** Throws a 403 when the authenticated user's role lacks `capability`. */
export function requireCapability(event: RequestEvent, capability: Capability): AuthenticatedUser {
	const user = requireUser(event);
	if (!can(user.role, capability)) {
		error(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ / You do not have permission to access this.');
	}
	return user;
}

/**
 * Guard for a role-prefixed area (`/app/*`, `/admin/*`, `/developer/*`).
 * A signed-in user whose role does NOT belong to `allowedRoles` is sent
 * back to their OWN area's home instead of being shown a dead end — this
 * is what keeps a USER out of `/admin/*`/`/developer/*` and vice versa.
 * An anonymous request still goes through `requireUser`'s /login redirect.
 */
export function requireArea(
	event: RequestEvent,
	allowedRoles: readonly UserRole[]
): AuthenticatedUser {
	const user = requireUser(event);
	if (!allowedRoles.includes(user.role)) {
		redirect(303, roleHomePath(user.role));
	}
	return user;
}

/**
 * Auth check for `+server.ts` API endpoints. Layout `load` guards do NOT
 * run for bare `+server.ts` requests, so every such endpoint must call this
 * (or `requireUser`/`requireArea`) itself. Returns a 401/403 JSON-friendly
 * HTTP error instead of a redirect, since the caller is `fetch`, not a
 * browser navigation.
 */
export function requireUserApi(event: RequestEvent): AuthenticatedUser {
	const user = event.locals.user;
	if (!user) {
		error(401, 'Authentication required.');
	}
	return user;
}

/**
 * Which roles may use each role-prefixed area. This is the single table the
 * request hook (`src/hooks.server.ts`) enforces for every NON-GET request,
 * because SvelteKit form actions (`+page.server.ts` `actions`) do NOT run
 * the parent `+layout.server.ts` load — the per-area `requireArea` call in
 * each layout therefore never protected POSTs on its own. Keep this in sync
 * with those layouts.
 */
export const AREA_ROLES: ReadonlyArray<{ prefix: string; roles: readonly UserRole[] }> = [
	{ prefix: '/admin', roles: ['ADMIN'] },
	{ prefix: '/developer', roles: ['DEVELOPER'] },
	{ prefix: '/app', roles: ['USER'] }
];

/** The roles allowed for `pathname`'s area, or `null` if it is not in one. */
export function areaRolesForPath(pathname: string): readonly UserRole[] | null {
	for (const area of AREA_ROLES) {
		if (pathname === area.prefix || pathname.startsWith(area.prefix + '/')) {
			return area.roles;
		}
	}
	return null;
}
