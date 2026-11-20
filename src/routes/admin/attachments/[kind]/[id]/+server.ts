import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireUserApi } from '$lib/server/permissions/guards';
import { readAttachment, type AttachmentKind } from '$lib/server/storage';

/**
 * Serves a benefit/leave request attachment to ADMIN reviewers.
 *
 * `/admin/*` layout `load` guards do NOT run for a bare `+server.ts`
 * request (same caveat as `src/routes/app/attachments/[kind]/[id]/
 * +server.ts`), so the ADMIN check happens here explicitly — this is NOT
 * the employee-ownership-checked route; any active ADMIN may view any
 * request's attachment, which is the point of this review surface.
 */
export const GET: RequestHandler = async (event) => {
	const user = requireUserApi(event);
	if (user.role !== 'ADMIN') {
		error(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ / You do not have permission to access this.');
	}

	const { kind, id } = event.params;
	if (kind !== 'benefit' && kind !== 'leave') {
		error(404, 'Not found.');
	}

	const attachment =
		kind === 'benefit'
			? await db.benefitAttachment.findUnique({ where: { id } })
			: await db.leaveAttachment.findUnique({ where: { id } });

	if (!attachment) {
		error(404, 'Not found.');
	}

	const bytes = await readAttachment(kind as AttachmentKind, attachment.storageKey);
	if (!bytes) {
		error(404, 'Not found.');
	}

	return new Response(new Uint8Array(bytes), {
		headers: {
			'Content-Type': attachment.mimeType,
			'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.originalFilename)}"`,
			'Cache-Control': 'private, max-age=60'
		}
	});
};
