import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { announcementSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

export const actions: Actions = {
	default: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const raw = {
			title: String(formData.get('title') ?? ''),
			body: String(formData.get('body') ?? '')
		};

		const parsed = announcementSchema(t).safeParse(raw);
		if (!parsed.success)
			return fail(400, { values: raw, errors: fieldErrorsFromIssues(parsed.error.issues) });

		const created = await db.announcement.create({ data: { ...parsed.data, isPublished: false } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'ANNOUNCEMENT_CREATED',
			entityType: 'Announcement',
			entityId: created.id
		});
		redirect(303, '/admin/announcements');
	}
};
