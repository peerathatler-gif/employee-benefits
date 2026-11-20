import type { LayoutServerLoad } from './$types';
import { requireArea } from '$lib/server/permissions/guards';

/**
 * Every route under `/developer/*` requires role DEVELOPER. A USER/ADMIN
 * account hitting `/developer/*` is redirected to their own area's home.
 *
 * NOTE: this phase only ships `/developer/dashboard` as a non-404 skeleton
 * — the full technical console (health, feature flags, audit log) is a
 * later phase.
 */
export const load: LayoutServerLoad = (event) => {
	const user = requireArea(event, ['DEVELOPER']);
	return { user };
};
