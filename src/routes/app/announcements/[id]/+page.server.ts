import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const announcement = await db.announcement.findUnique({ where: { id: params.id } });

	if (!announcement || !announcement.isPublished) {
		error(404, 'Not found.');
	}

	return { announcement };
};
