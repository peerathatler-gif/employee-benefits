import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

/**
 * Real (not mocked) admin landing page. Every number below is a direct
 * aggregate query against the live database — see the two chart data
 * builders further down for the "benefit usage trend" and "headcount by
 * department" series.
 */
export const load: PageServerLoad = async () => {
	try {
		const now = new Date();
		const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

		const [
			totalEmployees,
			activeEmployees,
			departmentCount,
			pendingBenefitRequests,
			pendingLeaveRequests,
			approvedBenefitSpendAgg,
			departmentsWithCounts,
			recentActivity,
			approvedBenefitRequestsThisYear
		] = await Promise.all([
			db.employee.count(),
			db.employee.count({ where: { user: { isActive: true } } }),
			db.department.count({ where: { isActive: true } }),
			db.benefitRequest.count({ where: { status: 'PENDING' } }),
			db.leaveRequest.count({ where: { status: 'PENDING' } }),
			db.benefitRequest.aggregate({
				where: { status: 'APPROVED', createdAt: { gte: yearStart } },
				_sum: { requestedAmount: true }
			}),
			db.department.findMany({
				where: { isActive: true },
				orderBy: { name: 'asc' },
				include: { _count: { select: { employees: true } } }
			}),
			db.auditLog.findMany({
				orderBy: { createdAt: 'desc' },
				take: 10,
				include: { actor: { select: { email: true } } }
			}),
			db.benefitRequest.findMany({
				where: {
					status: 'APPROVED',
					createdAt: { gte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 182) }
				},
				select: { requestedAmount: true, createdAt: true }
			})
		]);

		// Bucket approved benefit spend into the last 6 calendar months
		// (oldest first) so the trend chart reads left-to-right.
		const monthBuckets: { label: string; total: number }[] = [];
		for (let i = 5; i >= 0; i--) {
			const bucketDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
			monthBuckets.push({
				label: bucketDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
				total: 0
			});
		}
		for (const r of approvedBenefitRequestsThisYear) {
			const monthsAgo =
				(now.getUTCFullYear() - r.createdAt.getUTCFullYear()) * 12 +
				(now.getUTCMonth() - r.createdAt.getUTCMonth());
			const index = 5 - monthsAgo;
			if (index >= 0 && index < 6) {
				monthBuckets[index].total += Number(r.requestedAmount);
			}
		}

		return {
			totalEmployees,
			activeEmployees,
			departmentCount,
			pendingBenefitRequests,
			pendingLeaveRequests,
			approvedBenefitSpend: Number(approvedBenefitSpendAgg._sum.requestedAmount ?? 0),
			benefitUsageTrend: monthBuckets,
			headcountByDepartment: departmentsWithCounts.map((d) => ({
				name: d.name,
				count: d._count.employees
			})),
			recentActivity: recentActivity.map((a) => ({
				id: a.id,
				actorEmail: a.actor?.email ?? null,
				action: a.action,
				entityType: a.entityType,
				createdAt: a.createdAt.toISOString()
			})),
			dbUnreachable: false
		};
	} catch (err) {
		console.error('[admin/dashboard] database unreachable', err);
		return {
			totalEmployees: 0,
			activeEmployees: 0,
			departmentCount: 0,
			pendingBenefitRequests: 0,
			pendingLeaveRequests: 0,
			approvedBenefitSpend: 0,
			benefitUsageTrend: [] as { label: string; total: number }[],
			headcountByDepartment: [] as { name: string; count: number }[],
			recentActivity: [] as {
				id: string;
				actorEmail: string | null;
				action: string;
				entityType: string;
				createdAt: string;
			}[],
			dbUnreachable: true
		};
	}
};
