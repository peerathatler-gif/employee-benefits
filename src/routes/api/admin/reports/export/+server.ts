import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserApi } from '$lib/server/permissions/guards';
import { buildCsv } from '$lib/server/csv';
import {
	getBenefitUsageReport,
	getDepartmentReport,
	getEmployeeReport,
	getLeaveReport,
	getPendingRequestsReport,
	type ReportFilters
} from '$lib/server/admin/reports';

/**
 * Authenticated, filtered CSV export for `/admin/reports`.
 *
 * `/admin/*` layout guards don't run for a bare `+server.ts` — the ADMIN
 * check happens here explicitly, same as every other `/admin/**\/+server.ts`
 * in this app. Every cell goes through `buildCsv`/`escapeCsvCell`, which
 * neutralizes formula-injection payloads (a cell starting with `=`, `+`,
 * `-` or `@`) — do not add a row to this file without going through it.
 */
export const GET: RequestHandler = async (event) => {
	const user = requireUserApi(event);
	if (user.role !== 'ADMIN') {
		error(403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ / You do not have permission to access this.');
	}

	const { url } = event;
	const type = url.searchParams.get('type') ?? '';
	const dateFrom = url.searchParams.get('dateFrom') ?? '';
	const dateTo = url.searchParams.get('dateTo') ?? '';
	const departmentId = url.searchParams.get('departmentId') ?? '';

	const filters: ReportFilters = {
		dateFrom: dateFrom ? new Date(dateFrom) : undefined,
		dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999Z`) : undefined,
		departmentId: departmentId || undefined
	};

	let csv: string;
	let filename: string;

	switch (type) {
		case 'employee': {
			const rows = await getEmployeeReport(filters);
			csv = buildCsv(
				[
					'Employee code',
					'Name',
					'Department',
					'Position',
					'Employment status',
					'Hire date',
					'Email',
					'Account'
				],
				rows.map((r) => [
					r.employeeCode,
					r.name,
					r.department,
					r.position,
					r.employmentStatus,
					r.hireDate,
					r.email,
					r.accountActive
				])
			);
			filename = 'employee-report.csv';
			break;
		}
		case 'benefit': {
			const rows = await getBenefitUsageReport(filters);
			csv = buildCsv(
				[
					'Benefit',
					'Category',
					'Approved count',
					'Approved amount',
					'Pending count',
					'Rejected count'
				],
				rows.map((r) => [
					r.benefitName,
					r.category,
					r.approvedCount,
					r.approvedAmount,
					r.pendingCount,
					r.rejectedCount
				])
			);
			filename = 'benefit-usage-report.csv';
			break;
		}
		case 'leave': {
			const rows = await getLeaveReport(filters);
			csv = buildCsv(
				['Leave type', 'Approved count', 'Approved days', 'Pending count', 'Rejected count'],
				rows.map((r) => [
					r.leaveTypeName,
					r.approvedCount,
					r.approvedDays,
					r.pendingCount,
					r.rejectedCount
				])
			);
			filename = 'leave-report.csv';
			break;
		}
		case 'pending': {
			const rows = await getPendingRequestsReport(filters);
			csv = buildCsv(
				['Kind', 'Employee code', 'Employee name', 'Detail', 'Submitted at'],
				rows.map((r) => [r.kind, r.employeeCode, r.employeeName, r.detail, r.submittedAt])
			);
			filename = 'pending-requests-report.csv';
			break;
		}
		case 'department': {
			const rows = await getDepartmentReport(filters);
			csv = buildCsv(
				[
					'Department',
					'Total employees',
					'Active employees',
					'Pending benefit requests',
					'Pending leave requests'
				],
				rows.map((r) => [
					r.departmentName,
					r.totalEmployees,
					r.activeEmployees,
					r.pendingBenefitRequests,
					r.pendingLeaveRequests
				])
			);
			filename = 'department-report.csv';
			break;
		}
		default:
			error(400, 'Unknown report type.');
	}

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-store'
		}
	});
};
