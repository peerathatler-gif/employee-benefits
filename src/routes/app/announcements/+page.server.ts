import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
	const search = (url.searchParams.get('q') ?? '').trim();

	const announcements = await db.announcement.findMany({
		where: {
			isPublished: true,
			...(search ? { title: { contains: search } } : {})
		},
		orderBy: { publishedAt: 'desc' }
	});

	return { announcements, search };
};
