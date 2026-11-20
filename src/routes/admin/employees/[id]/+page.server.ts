import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { employeeEditSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';
import {
	disableEmployeeAccount,
	reactivateEmployeeAccount,
	resetEmployeePassword,
	updateEmployee
} from '$lib/server/admin/employees';

export const load: PageServerLoad = async ({ params }) => {
	const employee = await db.employee.findUnique({
		where: { id: params.id },
		include: { department: true, position: true, user: true }
	});
	if (!employee) error(404, 'Not found.');

	const [departments, positions] = await Promise.all([
		db.department.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
		db.position.findMany({ where: { isActive: true }, orderBy: { title: 'asc' } })
	]);

	return {
		employee: {
			id: employee.id,
			employeeCode: employee.employeeCode,
			firstName: employee.firstName,
			lastName: employee.lastName,
			phone: employee.phone ?? '',
			hireDate: employee.hireDate.toISOString().slice(0, 10),
			departmentId: employee.departmentId,
			positionId: employee.positionId,
			employmentStatus: employee.employmentStatus,
			email: employee.user.email,
			role: employee.user.role,
			isActive: employee.user.isActive,
			userId: employee.userId
		},
		departments: departments.map((d) => ({ id: d.id, name: d.name })),
		positions: positions.map((p) => ({ id: p.id, title: p.title, departmentId: p.departmentId }))
	};
};

export const actions: Actions = {
	update: async (event) => {
		const { request, params, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);

		const employee = await db.employee.findUnique({ where: { id: params.id! } });
		if (!employee) return fail(404, { formError: t('common.notFound') });

		const formData = await request.formData();
		const raw = {
			firstName: String(formData.get('firstName') ?? ''),
			lastName: String(formData.get('lastName') ?? ''),
			phone: String(formData.get('phone') ?? ''),
			hireDate: String(formData.get('hireDate') ?? ''),
			departmentId: String(formData.get('departmentId') ?? ''),
			positionId: String(formData.get('positionId') ?? ''),
			employmentStatus: String(formData.get('employmentStatus') ?? '')
		};

		const parsed = employeeEditSchema(t).safeParse(raw);
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFromIssues(parsed.error.issues) });
		}

		const position = await db.position.findFirst({
			where: { id: parsed.data.positionId, departmentId: parsed.data.departmentId }
		});
		if (!position) {
			return fail(400, {
				errors: { positionId: t('validation.required') } as Record<string, string>
			});
		}

		await updateEmployee(employee.id, {
			firstName: parsed.data.firstName,
			lastName: parsed.data.lastName,
			phone: parsed.data.phone || null,
			hireDate: new Date(parsed.data.hireDate),
			departmentId: parsed.data.departmentId,
			positionId: parsed.data.positionId,
			employmentStatus: parsed.data.employmentStatus
		});

		await recordAuditLog({
			actorUserId: admin.id,
			action: 'EMPLOYEE_UPDATED',
			entityType: 'Employee',
			entityId: employee.id
		});

		return { updated: true };
	},

	disable: async (event) => {
		const { params, locals } = event;
		const admin = locals.user!;
		const employee = await db.employee.findUnique({ where: { id: params.id! } });
		if (!employee) return fail(404, {});
		await disableEmployeeAccount(employee.userId);
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'USER_DISABLED',
			entityType: 'User',
			entityId: employee.userId,
			metadata: { via: 'admin/employees/[id]' }
		});
		return { disabled: true };
	},

	reactivate: async (event) => {
		const { params, locals } = event;
		const admin = locals.user!;
		const employee = await db.employee.findUnique({ where: { id: params.id! } });
		if (!employee) return fail(404, {});
		await reactivateEmployeeAccount(employee.userId);
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'USER_REACTIVATED',
			entityType: 'User',
			entityId: employee.userId,
			metadata: { via: 'admin/employees/[id]' }
		});
		return { reactivated: true };
	},

	resetPassword: async (event) => {
		const { params, locals } = event;
		const admin = locals.user!;
		const employee = await db.employee.findUnique({ where: { id: params.id! } });
		if (!employee) return fail(404, {});
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
