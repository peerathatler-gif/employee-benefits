import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { employeeCreateSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';
import { createEmployeeWithUser } from '$lib/server/admin/employees';

export const load: PageServerLoad = async () => {
	const [departments, positions] = await Promise.all([
		db.department.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
		db.position.findMany({ where: { isActive: true }, orderBy: { title: 'asc' } })
	]);
	return {
		departments: departments.map((d) => ({ id: d.id, name: d.name })),
		positions: positions.map((p) => ({ id: p.id, title: p.title, departmentId: p.departmentId }))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);

		const formData = await request.formData();
		const raw = {
			email: String(formData.get('email') ?? ''),
			employeeCode: String(formData.get('employeeCode') ?? ''),
			firstName: String(formData.get('firstName') ?? ''),
			lastName: String(formData.get('lastName') ?? ''),
			phone: String(formData.get('phone') ?? ''),
			hireDate: String(formData.get('hireDate') ?? ''),
			departmentId: String(formData.get('departmentId') ?? ''),
			positionId: String(formData.get('positionId') ?? '')
		};

		const parsed = employeeCreateSchema(t).safeParse(raw);
		if (!parsed.success) {
			return fail(400, { values: raw, errors: fieldErrorsFromIssues(parsed.error.issues) });
		}

		const position = await db.position.findFirst({
			where: { id: parsed.data.positionId, departmentId: parsed.data.departmentId }
		});
		if (!position) {
			return fail(400, {
				values: raw,
				errors: { positionId: t('validation.required') } as Record<string, string>
			});
		}

		const result = await createEmployeeWithUser({
			email: parsed.data.email,
			employeeCode: parsed.data.employeeCode,
			firstName: parsed.data.firstName,
			lastName: parsed.data.lastName,
			phone: parsed.data.phone || null,
			hireDate: new Date(parsed.data.hireDate),
			departmentId: parsed.data.departmentId,
			positionId: parsed.data.positionId
		});

		if (!result.ok) {
			const message =
				result.reason === 'duplicate-email'
					? t('admin.employees.duplicateEmail')
					: t('admin.employees.duplicateCode');
			const field = result.reason === 'duplicate-email' ? 'email' : 'employeeCode';
			return fail(409, { values: raw, errors: { [field]: message } as Record<string, string> });
		}

		await recordAuditLog({
			actorUserId: admin.id,
			action: 'EMPLOYEE_CREATED',
			entityType: 'Employee',
			entityId: result.employee.id,
			metadata: { email: result.user.email, employeeCode: result.employee.employeeCode }
		});

		// Deliberately NOT a redirect: a redirect would carry the one-time
		// password in a URL (server logs, browser history, Referer headers).
		// Returning it directly in the action result keeps it off every one
		// of those — same reasoning as `/forgot-password`'s dev-mode reset
		// link, which is likewise returned, never redirected-to.
		return {
			created: true,
			employeeId: result.employee.id,
			employeeName: `${result.employee.firstName} ${result.employee.lastName}`,
			oneTimePassword: result.oneTimePassword
		};
	}
};
