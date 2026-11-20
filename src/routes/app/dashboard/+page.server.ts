import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { listNotificationsForUser, unreadNotificationCount } from '$lib/server/notifications';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;

	try {
		const employee = await db.employee.findUnique({
			where: { userId: user.id },
			include: { department: true, position: true }
		});

		if (!employee) {
			const [notifications, unreadCount] = await Promise.all([
				listNotificationsForUser(user.id, 5),
				unreadNotificationCount(user.id)
			]);
			return {
				employee: null,
				dbUnreachable: false,
				remainingLeaveDays: 0,
				activeBenefitCount: 0,
				pendingRequestCount: 0,
				notifications,
				unreadCount,
				announcements: []
			};
		}

		const currentYear = new Date().getUTCFullYear();

		const [
			leaveBalances,
			employeeBenefits,
			pendingBenefitCount,
			pendingLeaveCount,
			notifications,
			unreadCount,
			announcements
		] = await Promise.all([
			db.leaveBalance.findMany({ where: { employeeId: employee.id, year: currentYear } }),
			db.employeeBenefit.findMany({
				where: { employeeId: employee.id, periodEnd: { gte: new Date() } }
			}),
			db.benefitRequest.count({ where: { employeeId: employee.id, status: 'PENDING' } }),
			db.leaveRequest.count({ where: { employeeId: employee.id, status: 'PENDING' } }),
			listNotificationsForUser(user.id, 5),
			unreadNotificationCount(user.id),
			db.announcement.findMany({
				where: { isPublished: true },
				orderBy: { publishedAt: 'desc' },
				take: 5
			})
		]);

		const remainingLeaveDays = leaveBalances.reduce(
			(sum, b) => sum + (Number(b.allocatedDays) - Number(b.usedDays)),
			0
		);
		const activeBenefitCount = employeeBenefits.filter(
			(b) => Number(b.allocatedAmount) - Number(b.usedAmount) > 0
		).length;

		return {
			employee,
			dbUnreachable: false,
			remainingLeaveDays,
			activeBenefitCount,
			pendingRequestCount: pendingBenefitCount + pendingLeaveCount,
			notifications,
			unreadCount,
			announcements
		};
	} catch (err) {
		console.error('[dashboard] database unreachable', err);
		return {
			employee: null,
			dbUnreachable: true,
			remainingLeaveDays: 0,
			activeBenefitCount: 0,
			pendingRequestCount: 0,
			notifications: [],
			unreadCount: 0,
			announcements: []
		};
	}
};
