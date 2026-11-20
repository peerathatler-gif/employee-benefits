import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireUserApi } from '$lib/server/permissions/guards';
import { readAvatar } from '$lib/server/storage';

/**
 * Serves the SIGNED-IN user's own avatar — there is no `:id` param, so
 * there is nothing to IDOR: this route can only ever return the caller's
 * own image. Bytes live in private storage (outside the webroot) and are
 * only reachable through this authenticated route.
 */
export const GET: RequestHandler = async (event) => {
	const user = requireUserApi(event);

	const employee = await db.employee.findUnique({
		where: { userId: user.id },
		select: { id: true, avatarMimeType: true }
	});

	if (!employee || !employee.avatarMimeType) {
		error(404, 'No avatar uploaded.');
	}

	const bytes = await readAvatar(employee.id);
	if (!bytes) {
		error(404, 'No avatar uploaded.');
	}

	return new Response(new Uint8Array(bytes), {
		headers: {
			'Content-Type': employee.avatarMimeType,
			'Cache-Control': 'private, max-age=60'
		}
	});
};
