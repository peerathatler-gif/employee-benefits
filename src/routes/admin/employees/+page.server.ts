import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import {
	disableEmployeeAccount,
	reactivateEmployeeAccount,
	resetEmployeePassword
} from '$lib/server/admin/employees';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const departmentId = url.searchParams.get('departmentId') ?? '';
	const employmentStatus = url.searchParams.get('employmentStatus') ?? '';
	const accountStatus = url.searchParams.get('accountStatus') ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	const where = {
		...(q
			? {
					OR: [
						{ firstName: { contains: q } },
						{ lastName: { contains: q } },
						{ employeeCode: { contains: q } },
						{ user: { email: { contains: q } } }
					]
				}
			: {}),
		...(departmentId ? { departmentId } : {}),
		...(employmentStatus
			? { employmentStatus: employmentStatus as 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' }
			: {}),
		...(accountStatus ? { user: { isActive: accountStatus === 'ACTIVE' } } : {})
	};

	const [total, employees, departments] = await Promise.all([
		db.employee.count({ where }),
		db.employee.findMany({
			where,
			include: { department: true, position: true, user: true },
			orderBy: { createdAt: 'desc' },
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE
		}),
		db.department.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
	]);

	return {
		employees: employees.map((e) => ({
			id: e.id,
			employeeCode: e.employeeCode,
			firstName: e.firstName,
			lastName: e.lastName,
			departmentName: e.department.name,
			positionTitle: e.position.title,
			employmentStatus: e.employmentStatus,
			email: e.user.email,
			isActive: e.user.isActive,
			userId: e.userId,
			avatarSrc: e.avatarMimeType ? `/admin/avatars/${e.id}` : null
		})),
		departments: departments.map((d) => ({ id: d.id, name: d.name })),
		total,
		page,
		pageSize: PAGE_SIZE,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		filters: { q, departmentId, employmentStatus, accountStatus }
	};
};

export const actions: Actions = {
	disable: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const employeeId = String(formData.get('employeeId') ?? '');

		const employee = await db.employee.findUnique({
			where: { id: employeeId },
			select: { userId: true }
		});
		if (!employee) return fail(404, { formError: t('common.notFound') });

		await disableEmployeeAccount(employee.userId);
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'USER_DISABLED',
			entityType: 'User',
			entityId: employee.userId,
			metadata: { via: 'admin/employees' }
		});
		return { disabled: true };
	},

	reactivate: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const employeeId = String(formData.get('employeeId') ?? '');

		const employee = await db.employee.findUnique({
			where: { id: employeeId },
			select: { userId: true }
		});
		if (!employee) return fail(404, { formError: t('common.notFound') });

		await reactivateEmployeeAccount(employee.userId);
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'USER_REACTIVATED',
			entityType: 'User',
			entityId: employee.userId,
			metadata: { via: 'admin/employees' }
		});
		return { reactivated: true };
	},

	resetPassword: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const employeeId = String(formData.get('employeeId') ?? '');

		const employee = await db.employee.findUnique({
			where: { id: employeeId },
			select: { userId: true }
		});
		if (!employee) return fail(404, { formError: t('common.notFound') });

		const oneTimePassword = await resetEmployeePassword(employee.userId);
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'USER_PASSWORD_RESET_BY_ADMIN',
			entityType: 'User',
			entityId: employee.userId
		});
		return { oneTimePassword };
	}
};
