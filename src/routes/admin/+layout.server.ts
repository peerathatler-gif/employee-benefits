import type { LayoutServerLoad } from './$types';
import { requireArea } from '$lib/server/permissions/guards';

/**
 * Every route under `/admin/*` requires role ADMIN. A USER/DEVELOPER
 * account hitting `/admin/*` is redirected to their own area's home.
 *
 * NOTE: this phase only ships `/admin/dashboard` as a non-404 skeleton —
 * the full HR backoffice (benefit/leave approvals, employee CRUD, etc) is
 * a later phase. The guard is real; the screens behind it are not yet.
 */
export const load: LayoutServerLoad = (event) => {
	const user = requireArea(event, ['ADMIN']);
	return { user };
};
