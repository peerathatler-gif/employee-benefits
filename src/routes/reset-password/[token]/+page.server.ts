import { createHash } from 'node:crypto';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { hashPassword } from '$lib/server/auth/passwords';
import { revokeAllSessionsForUser } from '$lib/server/auth/sessions';
import { resetPasswordSchema } from '$lib/server/validation/auth';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';

function hashToken(rawToken: string): string {
	return createHash('sha256').update(rawToken).digest('hex');
}

async function findValidToken(rawToken: string) {
	const tokenHash = hashToken(rawToken);
	const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
	if (!record) return null;
	if (record.usedAt) return null;
	if (record.expiresAt.getTime() <= Date.now()) return null;
	return record;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	if (locals.user) redirect(303, '/dashboard');

	try {
		const record = await findValidToken(params.token);
		return { valid: Boolean(record) };
	} catch (err) {
		console.error('[reset-password] database unreachable', err);
		return { valid: false, dbUnreachable: true };
	}
};

export const actions: Actions = {
	default: async (event) => {
		const { request, params } = event;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		const parsed = resetPasswordSchema(t).safeParse({ password, confirmPassword });
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFromIssues(parsed.error.issues), tokenInvalid: false });
		}

		let record;
		try {
			record = await findValidToken(params.token);
		} catch (err) {
			console.error('[reset-password] database unreachable', err);
			return fail(503, { formError: t('common.databaseUnreachable'), tokenInvalid: false });
		}

		if (!record) {
			return fail(400, { tokenInvalid: true, formError: t('auth.resetPassword.invalidToken') });
		}

		const passwordHash = await hashPassword(parsed.data.password);

		await db.$transaction([
			db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
			db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
		]);
		await revokeAllSessionsForUser(record.userId);

		await recordAuditLog({
			actorUserId: record.userId,
			action: 'PASSWORD_RESET_COMPLETED',
			entityType: 'User',
			entityId: record.userId
		});

		return { success: true };
	}
};
