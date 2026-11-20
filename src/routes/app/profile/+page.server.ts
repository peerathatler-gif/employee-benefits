import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { env } from '$lib/server/env';
import { hashPassword, verifyPassword } from '$lib/server/auth/passwords';
import { revokeAllSessionsForUser } from '$lib/server/auth/sessions';
import { changePasswordSchema } from '$lib/server/validation/auth';
import { updateProfileSchema } from '$lib/server/validation/profile';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import {
	saveAvatar,
	generateStorageKey,
	ALLOWED_AVATAR_MIME_TYPES,
	MAX_AVATAR_SIZE_BYTES
} from '$lib/server/storage';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;

	try {
		const employee = await db.employee.findUnique({
			where: { userId: user.id },
			include: { department: true, position: true }
		});
		const formattedHireDate = employee
			? new Intl.DateTimeFormat('en-CA', { timeZone: env.APP_TIMEZONE }).format(employee.hireDate)
			: null;
		return { employee, formattedHireDate, dbUnreachable: false };
	} catch (err) {
		console.error('[profile] database unreachable', err);
		return { employee: null, formattedHireDate: null, dbUnreachable: true };
	}
};

export const actions: Actions = {
	changePassword: async (event) => {
		const { request, locals } = event;
		const user = locals.user!;
		const t = getRequestTranslator(event);

		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmNewPassword = String(formData.get('confirmNewPassword') ?? '');

		const parsed = changePasswordSchema(t).safeParse({
			currentPassword,
			newPassword,
			confirmNewPassword
		});
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFromIssues(parsed.error.issues) });
		}

		let dbUser;
		try {
			dbUser = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
		} catch (err) {
			console.error('[profile] database unreachable', err);
			return fail(503, { formError: t('common.databaseUnreachable') });
		}

		if (!dbUser || !(await verifyPassword(dbUser.passwordHash, parsed.data.currentPassword))) {
			const errors: Record<string, string> = {
				currentPassword: t('profile.currentPasswordIncorrect')
			};
			return fail(400, { errors });
		}

		const passwordHash = await hashPassword(parsed.data.newPassword);
		await db.user.update({ where: { id: user.id }, data: { passwordHash } });

		// Session-safe: revoke every OTHER session, keep the one making this
		// request alive so the user isn't logged out by changing their own
		// password.
		await revokeAllSessionsForUser(user.id, locals.sessionId ?? undefined);

		await recordAuditLog({
			actorUserId: user.id,
			action: 'PASSWORD_CHANGED',
			entityType: 'User',
			entityId: user.id
		});

		return { passwordChanged: true };
	},

	/**
	 * Only `phone` is editable here — role, employeeCode, department and
	 * position are admin-controlled and are intentionally not accepted by
	 * this action even if a crafted request includes them.
	 */
	updateProfile: async (event) => {
		const { request, locals } = event;
		const user = locals.user!;
		const t = getRequestTranslator(event);

		const employee = await db.employee.findUnique({ where: { userId: user.id } });
		if (!employee) {
			return fail(404, { profileFormError: t('profile.noEmployeeRecord') });
		}

		const formData = await request.formData();
		const phone = String(formData.get('phone') ?? '');

		const parsed = updateProfileSchema(t).safeParse({ phone });
		if (!parsed.success) {
			return fail(400, { profileErrors: fieldErrorsFromIssues(parsed.error.issues) });
		}

		await db.employee.update({
			where: { id: employee.id },
			data: { phone: parsed.data.phone ? parsed.data.phone : null }
		});

		await recordAuditLog({
			actorUserId: user.id,
			action: 'PROFILE_UPDATED',
			entityType: 'Employee',
			entityId: employee.id
		});

		return { profileUpdated: true };
	},

	uploadAvatar: async (event) => {
		const { request, locals } = event;
		const user = locals.user!;
		const t = getRequestTranslator(event);

		const employee = await db.employee.findUnique({ where: { userId: user.id } });
		if (!employee) {
			return fail(404, { avatarFormError: t('profile.noEmployeeRecord') });
		}

		const formData = await request.formData();
		const file = formData.get('avatar');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { avatarFormError: t('profile.avatarRequired') });
		}
		if (
			!ALLOWED_AVATAR_MIME_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number])
		) {
			return fail(400, { avatarFormError: t('profile.avatarInvalidType') });
		}
		if (file.size > MAX_AVATAR_SIZE_BYTES) {
			return fail(400, { avatarFormError: t('profile.avatarTooLarge') });
		}

		await saveAvatar(employee.id, file);

		await db.employee.update({
			where: { id: employee.id },
			data: { avatarUrl: generateStorageKey(), avatarMimeType: file.type }
		});

		await recordAuditLog({
			actorUserId: user.id,
			action: 'AVATAR_UPDATED',
			entityType: 'Employee',
			entityId: employee.id
		});

		return { avatarUpdated: true };
	}
};
