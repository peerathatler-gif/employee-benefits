import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireUserApi } from '$lib/server/permissions/guards';
import { readAvatar } from '$lib/server/storage';

/**
 * Serves ANY employee's avatar to an ADMIN reviewer (unlike `/app/avatar`,
 * which only ever returns the caller's own photo). `/admin/*` layout
 * guards don't run for a bare `+server.ts`, so the ADMIN check happens
 * here explicitly, same as every other `/admin/**\/+server.ts` route.
 */
export const GET: RequestHandler = async (event) => {
	const user = requireUserApi(event);
	if (user.role !== 'ADMIN') {
		error(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ / You do not have permission to access this.');
	}

	const employee = await db.employee.findUnique({
		where: { id: event.params.employeeId },
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
