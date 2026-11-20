import { randomBytes, createHash } from 'node:crypto';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { env } from '$lib/server/env';
import { checkRateLimit, PASSWORD_RESET_RATE_LIMIT } from '$lib/server/auth/rate-limit';
import { forgotPasswordSchema } from '$lib/server/validation/auth';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { sendEmail } from '$lib/server/mailer';

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/dashboard');
};

export const actions: Actions = {
	default: async (event) => {
		const { request, getClientAddress } = event;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');

		const rateLimit = checkRateLimit(
			`forgot-password:${getClientAddress()}`,
			PASSWORD_RESET_RATE_LIMIT
		);
		if (!rateLimit.allowed) {
			// Still enumeration-safe: same generic success response, just a bit later.
			return { success: true, devResetUrl: null };
		}

		const parsed = forgotPasswordSchema(t).safeParse({ email });
		if (!parsed.success) {
			return fail(400, { email, errors: fieldErrorsFromIssues(parsed.error.issues) });
		}

		const normalizedEmail = parsed.data.email.trim().toLowerCase();
		let devResetUrl: string | null = null;

		try {
			const user = await db.user.findUnique({
				where: { email: normalizedEmail },
				select: { id: true, isActive: true }
			});

			if (user && user.isActive) {
				const rawToken = randomBytes(32).toString('base64url');
				const tokenHash = createHash('sha256').update(rawToken).digest('hex');

				await db.passwordResetToken.create({
					data: {
						userId: user.id,
						tokenHash,
						expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
					}
				});

				const resetUrl = `${env.ORIGIN}/reset-password/${rawToken}`;
				const emailResult = await sendEmail({
					to: normalizedEmail,
					subject: t('auth.resetPassword.title'),
					text: `${t('auth.forgotPassword.devModeBody')} ${resetUrl}`,
					html: `<p>${t('auth.forgotPassword.devModeBody')}</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
				});

				// Only surface the raw link when email delivery is not actually
				// configured (clearly-labeled local dev convenience) — never when
				// SMTP is live, and never when no matching account exists.
				if (!emailResult.delivered) {
					devResetUrl = resetUrl;
				}

				await recordAuditLog({
					actorUserId: user.id,
					action: 'PASSWORD_RESET_REQUESTED',
					entityType: 'User',
					entityId: user.id
				});
			}
		} catch (err) {
			console.error('[forgot-password] database unreachable', err);
			return fail(503, { email, formError: t('common.databaseUnreachable') });
		}

		// Always the same generic message, whether or not the account exists.
		return { success: true, devResetUrl };
	}
};
