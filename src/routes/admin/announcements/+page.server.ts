import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';

export const load: PageServerLoad = async () => {
	const announcements = await db.announcement.findMany({ orderBy: { createdAt: 'desc' } });
	return {
		announcements: announcements.map((a) => ({
			id: a.id,
			title: a.title,
			isPublished: a.isPublished,
			publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
			createdAt: a.createdAt.toISOString()
		}))
	};
};

export const actions: Actions = {
	publish: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.announcement.update({
			where: { id },
			data: { isPublished: true, publishedAt: new Date() }
		});
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'ANNOUNCEMENT_PUBLISHED',
			entityType: 'Announcement',
			entityId: id
		});
		return { published: true };
	},

	unpublish: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.announcement.update({ where: { id }, data: { isPublished: false } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'ANNOUNCEMENT_UNPUBLISHED',
			entityType: 'Announcement',
			entityId: id
		});
		return { unpublished: true };
	},

	deleteDraft: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		// Only an unpublished draft may be hard-deleted — a published
		// announcement is history and gets unpublished instead.
		const result = await db.announcement.deleteMany({ where: { id, isPublished: false } });
		if (result.count === 0) {
			return fail(400, { formError: t('admin.announcements.deleteDraftOnly') });
		}
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'ANNOUNCEMENT_DELETED',
			entityType: 'Announcement',
			entityId: id
		});
		return { deleted: true };
	}
};
