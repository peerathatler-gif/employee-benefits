import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireUserApi } from '$lib/server/permissions/guards';
import { readAttachment, type AttachmentKind } from '$lib/server/storage';

/**
 * Serves a benefit/leave request attachment, but only to the employee who
 * owns the parent request — ownership is re-checked here on every request
 * (never trust that a link was only ever shared with its owner).
 */
export const GET: RequestHandler = async (event) => {
	const user = requireUserApi(event);
	const { kind, id } = event.params;

	if (kind !== 'benefit' && kind !== 'leave') {
		error(404, 'Not found.');
	}

	const employee = await db.employee.findUnique({
		where: { userId: user.id },
		select: { id: true }
	});
	if (!employee) {
		error(404, 'Not found.');
	}

	const attachment =
		kind === 'benefit'
			? await db.benefitAttachment.findUnique({
					where: { id },
					include: { request: { select: { employeeId: true } } }
				})
			: await db.leaveAttachment.findUnique({
					where: { id },
					include: { request: { select: { employeeId: true } } }
				});

	if (!attachment || attachment.request.employeeId !== employee.id) {
		// Same 404 for "doesn't exist" and "not yours" — no existence oracle.
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
