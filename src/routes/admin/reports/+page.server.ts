import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	getBenefitUsageReport,
	getDepartmentReport,
	getEmployeeReport,
	getLeaveReport,
	getPendingRequestsReport,
	type ReportFilters
} from '$lib/server/admin/reports';

export const load: PageServerLoad = async ({ url }) => {
	const dateFrom = url.searchParams.get('dateFrom') ?? '';
	const dateTo = url.searchParams.get('dateTo') ?? '';
	const departmentId = url.searchParams.get('departmentId') ?? '';

	const filters: ReportFilters = {
		dateFrom: dateFrom ? new Date(dateFrom) : undefined,
		dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999Z`) : undefined,
		departmentId: departmentId || undefined
	};

	const [
		departments,
		employeeReport,
		benefitUsageReport,
		leaveReport,
		pendingRequestsReport,
		departmentReport
	] = await Promise.all([
		db.department.findMany({ orderBy: { name: 'asc' } }),
		getEmployeeReport(filters),
		getBenefitUsageReport(filters),
		getLeaveReport(filters),
		getPendingRequestsReport(filters),
		getDepartmentReport(filters)
	]);

	return {
		departments: departments.map((d) => ({ id: d.id, name: d.name })),
		employeeReport,
		benefitUsageReport,
		leaveReport,
		pendingRequestsReport,
		departmentReport,
		filters: { dateFrom, dateTo, departmentId }
	};
};
