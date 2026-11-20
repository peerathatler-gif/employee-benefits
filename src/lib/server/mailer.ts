/**
 * Email delivery with an explicit, clearly-labeled dev fallback.
 *
 * When SMTP_* is not fully configured (the default for local development),
 * we do NOT pretend the email was sent. Instead we log the content —
 * including the actual reset link — to the server console and return
 * `{ delivered: false }` so callers can show a dev-mode banner with the
 * link instead of a false "check your email" message.
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from './env';

export interface SendEmailInput {
	to: string;
	subject: string;
	text: string;
	html: string;
}

export interface SendEmailResult {
	delivered: boolean;
	/** Only set when delivered=false, so dev UIs can surface it directly. */
	devNote?: string;
}

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
	if (cachedTransport) return cachedTransport;
	cachedTransport = nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: Number(env.SMTP_PORT),
		secure: Number(env.SMTP_PORT) === 465,
		auth:
			env.SMTP_USER && env.SMTP_PASSWORD
				? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
				: undefined
	});
	return cachedTransport;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
	if (!env.smtpConfigured) {
		console.warn(
			`[mailer:dev-mode] No SMTP configured — not sending a real email.\n` +
				`  To: ${input.to}\n  Subject: ${input.subject}\n  Body:\n${input.text}\n`
		);
		return {
			delivered: false,
			devNote:
				'ไม่ได้ตั้งค่าเซิร์ฟเวอร์อีเมล (SMTP) — นี่คือโหมดพัฒนา / No SMTP configured — this is dev mode.'
		};
	}

	try {
		await getTransport().sendMail({
			from: env.SMTP_FROM,
			to: input.to,
			subject: input.subject,
			text: input.text,
			html: input.html
		});
		return { delivered: true };
	} catch (err) {
		console.error('[mailer] failed to send email', err);
		return {
			delivered: false,
			devNote: 'ไม่สามารถส่งอีเมลได้ในขณะนี้ / Failed to send email right now.'
		};
	}
}
