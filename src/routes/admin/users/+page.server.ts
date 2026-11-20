import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { setUserActive, changeUserRole } from '$lib/server/admin/users';
import { userRoleChangeSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const role = url.searchParams.get('role') ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	const where = {
		...(q ? { email: { contains: q } } : {}),
		...(role ? { role: role as 'USER' | 'DEVELOPER' | 'ADMIN' } : {})
	};

	const [total, users] = await Promise.all([
		db.user.count({ where }),
		db.user.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE
		})
	]);

	return {
		users: users.map((u) => ({
			id: u.id,
			email: u.email,
			role: u.role,
			isActive: u.isActive,
			lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null
		})),
		total,
		page,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		filters: { q, role }
	};
};

export const actions: Actions = {
	setActive: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const userId = String(formData.get('userId') ?? '');
		const isActive = formData.get('isActive') === 'true';

		const result = await setUserActive(userId, isActive, admin.id);
		if (!result.ok) {
			const key =
				result.reason === 'last-admin' ? 'admin.users.lastAdminProtected' : 'common.notFound';
			return fail(409, { formError: t(key) });
		}
		return isActive ? { reactivated: true } : { disabled: true };
	},

	changeRole: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const userId = String(formData.get('userId') ?? '');
		const raw = { role: String(formData.get('role') ?? '') };

		const parsed = userRoleChangeSchema(t).safeParse(raw);
		if (!parsed.success) return fail(400, { errors: fieldErrorsFromIssues(parsed.error.issues) });

		const result = await changeUserRole(userId, parsed.data.role, admin.id);
		if (!result.ok) {
			const key =
				result.reason === 'last-admin'
					? 'admin.users.lastAdminProtected'
					: result.reason === 'self'
						? 'admin.users.cannotChangeOwnRole'
						: 'common.notFound';
			return fail(409, { formError: t(key) });
		}
		return { roleChanged: true };
	}
};
