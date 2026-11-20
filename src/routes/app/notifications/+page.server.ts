import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	listNotificationsForUser,
	markAllNotificationsRead,
	markNotificationRead
} from '$lib/server/notifications';
import { getRequestTranslator } from '$lib/server/locale';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const notifications = await listNotificationsForUser(user.id, 100);
	return { notifications };
};

export const actions: Actions = {
	markRead: async (event) => {
		const { request, locals } = event;
		const user = locals.user!;
		const t = getRequestTranslator(event);

		const formData = await request.formData();
		const notificationId = String(formData.get('notificationId') ?? '');

		const ok = await markNotificationRead(user.id, notificationId);
		if (!ok) {
			return fail(400, { formError: t('notifications.markReadFailed') });
		}
		return { marked: true };
	},

	markAllRead: async (event) => {
		const user = event.locals.user!;
		await markAllNotificationsRead(user.id);
		return { markedAll: true };
	}
};
