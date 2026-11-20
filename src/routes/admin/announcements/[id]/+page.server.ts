import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { announcementSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

export const load: PageServerLoad = async ({ params }) => {
	const announcement = await db.announcement.findUnique({ where: { id: params.id } });
	if (!announcement) error(404, 'Not found.');
	return { announcement };
};

export const actions: Actions = {
	update: async (event) => {
		const { request, params, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const raw = {
			title: String(formData.get('title') ?? ''),
			body: String(formData.get('body') ?? '')
		};

		const parsed = announcementSchema(t).safeParse(raw);
		if (!parsed.success) return fail(400, { errors: fieldErrorsFromIssues(parsed.error.issues) });

		await db.announcement.update({ where: { id: params.id! }, data: parsed.data });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'ANNOUNCEMENT_UPDATED',
			entityType: 'Announcement',
			entityId: params.id!
		});
		return { updated: true };
	}
};
