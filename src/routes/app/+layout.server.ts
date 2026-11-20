import type { LayoutServerLoad } from './$types';
import { requireArea } from '$lib/server/permissions/guards';

/**
 * Every route under `/app/*` (employee self-service) requires a signed-in
 * session with role USER. An ADMIN/DEVELOPER account hitting `/app/*` is
 * redirected to their own area's home instead — see `requireArea`.
 */
export const load: LayoutServerLoad = (event) => {
	const user = requireArea(event, ['USER']);
	return { user };
};
