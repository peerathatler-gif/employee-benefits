/**
 * Admin employee management: creating a login + HR record together, and
 * disabling/reactivating that account.
 *
 * Password handling follows the same one-time-reveal pattern as
 * `prisma/seed.ts`: a random password is generated server-side, hashed, and
 * returned to the caller EXACTLY ONCE so the admin screen can show it in a
 * "copy this now, it will not be shown again" banner. Nothing ever stores
 * the plaintext. (We deliberately did not reuse the forgot-password token
 * flow here — a brand-new hire has no existing session/device to click an
 * email link from during onboarding, so handing HR a password to relay
 * through its own secure channel is the more practical of the two options
 * the brief allows; `/forgot-password` remains available afterwards.)
 */
import { randomBytes } from 'node:crypto';
import { db } from '../db';
import { hashPassword } from '../auth/passwords';
import { revokeAllSessionsForUser } from '../auth/sessions';
import type { Employee, EmploymentStatus, User } from '../../../generated/prisma/client';

export function generateOneTimePassword(): string {
	// 16 random bytes -> ~22 base64url chars: well above the app's 10-char minimum.
	return randomBytes(16).toString('base64url');
}

export interface CreateEmployeeInput {
	email: string;
	employeeCode: string;
	firstName: string;
	lastName: string;
	phone: string | null;
	hireDate: Date;
	departmentId: string;
	positionId: string;
}

export type CreateEmployeeResult =
	| { ok: true; user: User; employee: Employee; oneTimePassword: string }
	| { ok: false; reason: 'duplicate-email' | 'duplicate-code' };

/**
 * Creates the `User` and `Employee` rows atomically — either both exist or
 * neither does. Checks both unique constraints up front (clear Thai/English
 * error) and still relies on the DB's own unique indexes as the final,
 * race-safe guard (caught below) since two admins could submit at once.
 */
export async function createEmployeeWithUser(
	input: CreateEmployeeInput
): Promise<CreateEmployeeResult> {
	const normalizedEmail = input.email.trim().toLowerCase();

	const [existingUser, existingEmployee] = await Promise.all([
		db.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
		db.employee.findUnique({ where: { employeeCode: input.employeeCode }, select: { id: true } })
	]);
	if (existingUser) return { ok: false, reason: 'duplicate-email' };
	if (existingEmployee) return { ok: false, reason: 'duplicate-code' };

	const oneTimePassword = generateOneTimePassword();
	const passwordHash = await hashPassword(oneTimePassword);

	try {
		const { user, employee } = await db.$transaction(async (tx) => {
			const user = await tx.user.create({
				data: { email: normalizedEmail, passwordHash, role: 'USER', isActive: true }
			});
			const employee = await tx.employee.create({
				data: {
					userId: user.id,
					employeeCode: input.employeeCode,
					firstName: input.firstName,
					lastName: input.lastName,
					phone: input.phone || null,
					hireDate: input.hireDate,
					departmentId: input.departmentId,
					positionId: input.positionId,
					employmentStatus: 'ACTIVE'
				}
			});
			return { user, employee };
		});

		return { ok: true, user, employee, oneTimePassword };
	} catch (err) {
		// Unique constraint race (P2002) between our pre-check and the insert.
		if (isUniqueConstraintError(err, 'email')) return { ok: false, reason: 'duplicate-email' };
		if (isUniqueConstraintError(err, 'employeeCode'))
			return { ok: false, reason: 'duplicate-code' };
		throw err;
	}
}

function isUniqueConstraintError(err: unknown, field: string): boolean {
	if (!err || typeof err !== 'object') return false;
	const code = (err as { code?: string }).code;
	if (code !== 'P2002') return false;
	const target = (err as { meta?: { target?: string[] | string } }).meta?.target;
	if (!target) return false;
	return Array.isArray(target) ? target.includes(field) : target === field;
}

export interface EditEmployeeInput {
	firstName: string;
	lastName: string;
	phone: string | null;
	hireDate: Date;
	departmentId: string;
	positionId: string;
	employmentStatus: EmploymentStatus;
}

export async function updateEmployee(
	employeeId: string,
	input: EditEmployeeInput
): Promise<Employee> {
	return db.employee.update({
		where: { id: employeeId },
		data: {
			firstName: input.firstName,
			lastName: input.lastName,
			phone: input.phone || null,
			hireDate: input.hireDate,
			departmentId: input.departmentId,
			positionId: input.positionId,
			employmentStatus: input.employmentStatus
		}
	});
}

/**
 * Disables the employee's LOGIN ACCOUNT (not just a cosmetic flag) and
 * revokes every active session for it immediately, so access actually ends
 * on the next request, not just on next login.
 */
export async function disableEmployeeAccount(userId: string): Promise<void> {
	await db.$transaction(async (tx) => {
		await tx.user.update({ where: { id: userId }, data: { isActive: false } });
		await revokeAllSessionsForUser(userId, undefined, tx);
	});
}

export async function reactivateEmployeeAccount(userId: string): Promise<void> {
	await db.user.update({ where: { id: userId }, data: { isActive: true } });
}

/** Issues a fresh one-time password for an existing employee's account. */
export async function resetEmployeePassword(userId: string): Promise<string> {
	const oneTimePassword = generateOneTimePassword();
	const passwordHash = await hashPassword(oneTimePassword);
	await db.$transaction(async (tx) => {
		await tx.user.update({ where: { id: userId }, data: { passwordHash } });
		await revokeAllSessionsForUser(userId, undefined, tx);
	});
	return oneTimePassword;
}
