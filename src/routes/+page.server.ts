import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { roleHomePath } from '$lib/permissions/roles';

/** The root route only ever redirects: signed-in users go to their own
 * role-prefixed home, everyone else goes to the login page. */
export const load: PageServerLoad = ({ locals }) => {
	redirect(303, locals.user ? roleHomePath(locals.user.role) : '/login');
};
