/**
 * Synthetic seed data for local development.
 *
 * Run via `npx prisma db seed` (wired up in prisma.config.ts to
 * `tsx prisma/seed.ts`). This script runs OUTSIDE of SvelteKit/Vite, so it
 * cannot use `$lib/...` aliases or `$env/*` modules — it reads `DATABASE_URL`
 * straight from `process.env` (loaded by `prisma.config.ts`'s `dotenv/config`
 * import, which runs before this script) and builds its own Prisma client.
 *
 * Demo account passwords are generated at random on every run and printed
 * ONCE to the console — they are never hardcoded and are not stored
 * anywhere else. If you lose them, just re-run the seed (it upserts, so
 * existing demo users get a fresh random password each run) or use
 * /forgot-password.
 *
 * For local dev convenience you may instead fix a known password via
 * SEED_DEFAULT_PASSWORD (applies to all three demo accounts) or the
 * per-role SEED_ADMIN_PASSWORD / SEED_DEVELOPER_PASSWORD / SEED_USER_PASSWORD
 * overrides in .env. Never set these in a shared or production environment.
 */
import { randomBytes } from 'node:crypto';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/lib/server/auth/passwords';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error(
		'DATABASE_URL is required to run the seed script. Copy .env.example to .env first.'
	);
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

function generatePassword(): string {
	// 16 random bytes -> ~22 base64url chars: well above the app's 10-char minimum.
	return randomBytes(16).toString('base64url');
}

async function upsertDemoUser(
	email: string,
	role: 'ADMIN' | 'DEVELOPER' | 'USER',
	fixedPassword?: string
) {
	const password = fixedPassword || generatePassword();
	const passwordHash = await hashPassword(password);
	const user = await prisma.user.upsert({
		where: { email },
		update: { passwordHash, role, isActive: true },
		create: { email, passwordHash, role, isActive: true }
	});
	return { user, password };
}

async function main() {
	const [hr, it, ops] = await Promise.all([
		prisma.department.upsert({
			where: { code: 'HR' },
			update: {},
			create: { code: 'HR', name: 'Human Resources' }
		}),
		prisma.department.upsert({
			where: { code: 'IT' },
			update: {},
			create: { code: 'IT', name: 'Information Technology' }
		}),
		prisma.department.upsert({
			where: { code: 'OPS' },
			update: {},
			create: { code: 'OPS', name: 'Operations' }
		})
	]);

	const [hrManager, itStaff, itSystemAdmin, opsStaff] = await Promise.all([
		prisma.position.upsert({
			where: { departmentId_code: { departmentId: hr.id, code: 'HR-MGR' } },
			update: {},
			create: { departmentId: hr.id, code: 'HR-MGR', title: 'HR Manager' }
		}),
		prisma.position.upsert({
			where: { departmentId_code: { departmentId: it.id, code: 'IT-STAFF' } },
			update: {},
			create: { departmentId: it.id, code: 'IT-STAFF', title: 'IT Staff' }
		}),
		prisma.position.upsert({
			where: { departmentId_code: { departmentId: it.id, code: 'IT-SYSADMIN' } },
			update: {},
			create: { departmentId: it.id, code: 'IT-SYSADMIN', title: 'System Administrator' }
		}),
		prisma.position.upsert({
			where: { departmentId_code: { departmentId: ops.id, code: 'OPS-STAFF' } },
			update: {},
			create: { departmentId: ops.id, code: 'OPS-STAFF', title: 'Operations Staff' }
		})
	]);

	const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
	const developerEmail = process.env.SEED_DEVELOPER_EMAIL || 'developer@example.com';
	const userEmail = process.env.SEED_USER_EMAIL || 'user@example.com';

	const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || undefined;
	const admin = await upsertDemoUser(
		adminEmail,
		'ADMIN',
		process.env.SEED_ADMIN_PASSWORD || defaultPassword
	);
	const developer = await upsertDemoUser(
		developerEmail,
		'DEVELOPER',
		process.env.SEED_DEVELOPER_PASSWORD || defaultPassword
	);
	const user = await upsertDemoUser(
		userEmail,
		'USER',
		process.env.SEED_USER_PASSWORD || defaultPassword
	);

	await prisma.employee.upsert({
		where: { userId: admin.user.id },
		update: {},
		create: {
			userId: admin.user.id,
			employeeCode: 'EMP-0001',
			firstName: 'Admin',
			lastName: 'User',
			hireDate: new Date('2020-01-15T00:00:00Z'),
			departmentId: hr.id,
			positionId: hrManager.id,
			employmentStatus: 'ACTIVE'
		}
	});

	await prisma.employee.upsert({
		where: { userId: user.user.id },
		update: {},
		create: {
			userId: user.user.id,
			employeeCode: 'EMP-0002',
			firstName: 'Somchai',
			lastName: 'Employee',
			hireDate: new Date('2023-03-01T00:00:00Z'),
			departmentId: ops.id,
			positionId: opsStaff.id,
			employmentStatus: 'ACTIVE'
		}
	});

	// The DEVELOPER demo account intentionally has NO Employee record: it's a
	// technical-maintenance account, not an HR identity, which is also a good
	// way to exercise the "no employee record linked" empty state.
	void itStaff;
	void itSystemAdmin;

	const userEmployee = await prisma.employee.findUnique({ where: { userId: user.user.id } });
	const adminEmployee = await prisma.employee.findUnique({ where: { userId: admin.user.id } });

	// --- Leave types + this year's balances -----------------------------
	const [annualLeave, sickLeave, personalLeave] = await Promise.all([
		prisma.leaveType.upsert({
			where: { code: 'ANNUAL' },
			update: {},
			create: { code: 'ANNUAL', name: 'Annual leave', defaultDays: 10 }
		}),
		prisma.leaveType.upsert({
			where: { code: 'SICK' },
			update: {},
			create: { code: 'SICK', name: 'Sick leave', defaultDays: 30 }
		}),
		prisma.leaveType.upsert({
			where: { code: 'PERSONAL' },
			update: {},
			create: { code: 'PERSONAL', name: 'Personal leave', defaultDays: 3 }
		})
	]);

	const currentYear = new Date().getUTCFullYear();
	if (userEmployee) {
		await Promise.all(
			[
				{ leaveTypeId: annualLeave.id, allocatedDays: annualLeave.defaultDays, usedDays: 2 },
				{ leaveTypeId: sickLeave.id, allocatedDays: sickLeave.defaultDays, usedDays: 0 },
				{ leaveTypeId: personalLeave.id, allocatedDays: personalLeave.defaultDays, usedDays: 1 }
			].map((b) =>
				prisma.leaveBalance.upsert({
					where: {
						employeeId_leaveTypeId_year: {
							employeeId: userEmployee.id,
							leaveTypeId: b.leaveTypeId,
							year: currentYear
						}
					},
					update: {},
					create: { employeeId: userEmployee.id, year: currentYear, ...b }
				})
			)
		);
	}

	// --- Benefit categories + catalog -----------------------------------
	const [healthCategory, wellnessCategory, educationCategory] = await Promise.all([
		prisma.benefitCategory.upsert({
			where: { code: 'HEALTH' },
			update: {},
			create: { code: 'HEALTH', name: 'Health' }
		}),
		prisma.benefitCategory.upsert({
			where: { code: 'WELLNESS' },
			update: {},
			create: { code: 'WELLNESS', name: 'Wellness' }
		}),
		prisma.benefitCategory.upsert({
			where: { code: 'EDUCATION' },
			update: {},
			create: { code: 'EDUCATION', name: 'Education' }
		})
	]);

	const benefitWindowStart = new Date(`${currentYear}-01-01T00:00:00Z`);

	async function upsertBenefit(data: {
		name: string;
		categoryId: string;
		description: string;
		defaultLimit: number;
		periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
	}) {
		const existing = await prisma.benefit.findFirst({ where: { name: data.name } });
		if (existing) {
			return prisma.benefit.update({ where: { id: existing.id }, data });
		}
		return prisma.benefit.create({
			data: { ...data, startDate: benefitWindowStart, isActive: true }
		});
	}

	const healthCheckup = await upsertBenefit({
		name: 'Annual Health Checkup',
		categoryId: healthCategory.id,
		description: 'Reimbursement for an annual medical checkup.',
		defaultLimit: 5000,
		periodType: 'YEARLY'
	});
	const dentalCare = await upsertBenefit({
		name: 'Dental Care',
		categoryId: healthCategory.id,
		description: 'Reimbursement for dental treatment.',
		defaultLimit: 3000,
		periodType: 'YEARLY'
	});
	const gymMembership = await upsertBenefit({
		name: 'Gym Membership',
		categoryId: wellnessCategory.id,
		description: 'Monthly gym membership reimbursement.',
		defaultLimit: 1000,
		periodType: 'MONTHLY'
	});
	const trainingCourse = await upsertBenefit({
		name: 'Training Course',
		categoryId: educationCategory.id,
		description: 'Reimbursement for a job-related training course or certification.',
		defaultLimit: 10000,
		periodType: 'YEARLY'
	});

	// Gym Membership gets a slightly higher global allowance than its
	// default via a department-agnostic policy.
	const existingGymPolicy = await prisma.benefitPolicy.findFirst({
		where: { benefitId: gymMembership.id, departmentId: null }
	});
	if (!existingGymPolicy) {
		await prisma.benefitPolicy.create({
			data: {
				benefitId: gymMembership.id,
				departmentId: null,
				limitAmount: 1200,
				effectiveStart: benefitWindowStart
			}
		});
	}

	// Training Course is restricted to IT and Operations (not HR) — this
	// demonstrates the per-department eligibility rule end to end.
	for (const dept of [it, ops]) {
		const existingPolicy = await prisma.benefitPolicy.findFirst({
			where: { benefitId: trainingCourse.id, departmentId: dept.id }
		});
		if (!existingPolicy) {
			await prisma.benefitPolicy.create({
				data: {
					benefitId: trainingCourse.id,
					departmentId: dept.id,
					limitAmount: 10000,
					effectiveStart: benefitWindowStart
				}
			});
		}
	}
	void healthCheckup;
	void dentalCare;

	// --- Announcements ----------------------------------------------------
	await prisma.announcement.upsert({
		where: { id: 'seed-announcement-welcome' },
		update: {},
		create: {
			id: 'seed-announcement-welcome',
			title: 'Welcome to the new Employee Benefits portal',
			body: 'You can now view your benefits, submit requests, and manage leave directly from this portal.',
			isPublished: true,
			publishedAt: new Date()
		}
	});
	await prisma.announcement.upsert({
		where: { id: 'seed-announcement-holiday' },
		update: {},
		create: {
			id: 'seed-announcement-holiday',
			title: 'Public holiday schedule for this year',
			body: 'Please check with HR for the full list of public holidays for this year.',
			isPublished: true,
			publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
		}
	});
	await prisma.announcement.upsert({
		where: { id: 'seed-announcement-draft' },
		update: {},
		create: {
			id: 'seed-announcement-draft',
			title: '(Draft) Upcoming benefits review',
			body: 'This announcement is not published yet and should never appear in the employee portal.',
			isPublished: false
		}
	});

	// --- Notifications ------------------------------------------------------
	if (userEmployee) {
		await prisma.notification.upsert({
			where: { id: 'seed-notification-user-welcome' },
			update: {},
			create: {
				id: 'seed-notification-user-welcome',
				userId: user.user.id,
				title: 'Welcome!',
				body: 'Your employee account is ready. Explore your benefits and leave balances.'
			}
		});
	}
	if (adminEmployee) {
		await prisma.notification.upsert({
			where: { id: 'seed-notification-admin-welcome' },
			update: {},
			create: {
				id: 'seed-notification-admin-welcome',
				userId: admin.user.id,
				title: 'Welcome!',
				body: 'Your HR administrator account is ready.'
			}
		});
	}

	console.log('\n=== Seed complete ===');
	console.log(
		'These demo passwords are shown ONCE — save them now (they are not stored anywhere):\n'
	);
	console.log(`  ADMIN     ${adminEmail}  /  ${admin.password}`);
	console.log(`  DEVELOPER ${developerEmail}  /  ${developer.password}`);
	console.log(`  USER      ${userEmail}  /  ${user.password}`);
	console.log('');
}

main()
	.catch((err) => {
		console.error(err);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
