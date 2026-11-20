/**
 * Aggregate report queries shared between `/admin/reports` (on-screen
 * tables) and `GET /api/admin/reports/export` (CSV download) — kept in one
 * place so the two surfaces can never show different numbers for the same
 * filters.
 */
import { db } from '../db';

export interface ReportFilters {
	dateFrom?: Date;
	dateTo?: Date;
	departmentId?: string;
}

function dateRangeWhere(from?: Date, to?: Date) {
	if (!from && !to) return {};
	return {
		createdAt: {
			...(from ? { gte: from } : {}),
			...(to ? { lte: to } : {})
		}
	};
}

export interface EmployeeReportRow {
	employeeCode: string;
	name: string;
	department: string;
	position: string;
	employmentStatus: string;
	hireDate: string;
	email: string;
	accountActive: string;
}

export async function getEmployeeReport(filters: ReportFilters): Promise<EmployeeReportRow[]> {
	const employees = await db.employee.findMany({
		where: { ...(filters.departmentId ? { departmentId: filters.departmentId } : {}) },
		include: { department: true, position: true, user: true },
		orderBy: { employeeCode: 'asc' }
	});
	return employees.map((e) => ({
		employeeCode: e.employeeCode,
		name: `${e.firstName} ${e.lastName}`,
		department: e.department.name,
		position: e.position.title,
		employmentStatus: e.employmentStatus,
		hireDate: e.hireDate.toISOString().slice(0, 10),
		email: e.user.email,
		accountActive: e.user.isActive ? 'ACTIVE' : 'INACTIVE'
	}));
}

export interface BenefitUsageReportRow {
	benefitName: string;
	category: string;
	approvedCount: number;
	approvedAmount: string;
	pendingCount: number;
	rejectedCount: number;
}

export async function getBenefitUsageReport(
	filters: ReportFilters
): Promise<BenefitUsageReportRow[]> {
	const where = {
		...dateRangeWhere(filters.dateFrom, filters.dateTo),
		...(filters.departmentId ? { employee: { departmentId: filters.departmentId } } : {})
	};

	const requests = await db.benefitRequest.findMany({
		where,
		include: { benefit: { include: { category: true } } }
	});

	const byBenefit = new Map<string, BenefitUsageReportRow>();
	for (const r of requests) {
		const key = r.benefitId;
		const row =
			byBenefit.get(key) ??
			({
				benefitName: r.benefit.name,
				category: r.benefit.category.name,
				approvedCount: 0,
				approvedAmount: '0',
				pendingCount: 0,
				rejectedCount: 0
			} satisfies BenefitUsageReportRow);

		if (r.status === 'APPROVED') {
			row.approvedCount += 1;
			row.approvedAmount = (Number(row.approvedAmount) + Number(r.requestedAmount)).toString();
		} else if (r.status === 'PENDING') {
			row.pendingCount += 1;
		} else if (r.status === 'REJECTED') {
			row.rejectedCount += 1;
		}
		byBenefit.set(key, row);
	}

	return [...byBenefit.values()].sort((a, b) => a.benefitName.localeCompare(b.benefitName));
}

export interface LeaveReportRow {
	leaveTypeName: string;
	approvedCount: number;
	approvedDays: string;
	pendingCount: number;
	rejectedCount: number;
}

export async function getLeaveReport(filters: ReportFilters): Promise<LeaveReportRow[]> {
	const where = {
		...dateRangeWhere(filters.dateFrom, filters.dateTo),
		...(filters.departmentId ? { employee: { departmentId: filters.departmentId } } : {})
	};

	const requests = await db.leaveRequest.findMany({ where, include: { leaveType: true } });

	const byType = new Map<string, LeaveReportRow>();
	for (const r of requests) {
		const key = r.leaveTypeId;
		const row =
			byType.get(key) ??
			({
				leaveTypeName: r.leaveType.name,
				approvedCount: 0,
				approvedDays: '0',
				pendingCount: 0,
				rejectedCount: 0
			} satisfies LeaveReportRow);

		if (r.status === 'APPROVED') {
			row.approvedCount += 1;
			row.approvedDays = (Number(row.approvedDays) + Number(r.totalDays)).toString();
		} else if (r.status === 'PENDING') {
			row.pendingCount += 1;
		} else if (r.status === 'REJECTED') {
			row.rejectedCount += 1;
		}
		byType.set(key, row);
	}

	return [...byType.values()].sort((a, b) => a.leaveTypeName.localeCompare(b.leaveTypeName));
}

export interface PendingRequestRow {
	kind: 'BENEFIT' | 'LEAVE';
	employeeCode: string;
	employeeName: string;
	detail: string;
	submittedAt: string;
}

export async function getPendingRequestsReport(
	filters: ReportFilters
): Promise<PendingRequestRow[]> {
	const deptWhere = filters.departmentId
		? { employee: { departmentId: filters.departmentId } }
		: {};

	const [benefitRequests, leaveRequests] = await Promise.all([
		db.benefitRequest.findMany({
			where: {
				status: 'PENDING',
				...dateRangeWhere(filters.dateFrom, filters.dateTo),
				...deptWhere
			},
			include: { employee: true, benefit: true }
		}),
		db.leaveRequest.findMany({
			where: {
				status: 'PENDING',
				...dateRangeWhere(filters.dateFrom, filters.dateTo),
				...deptWhere
			},
			include: { employee: true, leaveType: true }
		})
	]);

	const rows: PendingRequestRow[] = [
		...benefitRequests.map((r) => ({
			kind: 'BENEFIT' as const,
			employeeCode: r.employee.employeeCode,
			employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
			detail: `${r.benefit.name} (${r.requestedAmount.toString()})`,
			submittedAt: r.createdAt.toISOString()
		})),
		...leaveRequests.map((r) => ({
			kind: 'LEAVE' as const,
			employeeCode: r.employee.employeeCode,
			employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
			detail: `${r.leaveType.name} (${r.totalDays.toString()} days)`,
			submittedAt: r.createdAt.toISOString()
		}))
	];

	return rows.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export interface DepartmentReportRow {
	departmentName: string;
	totalEmployees: number;
	activeEmployees: number;
	pendingBenefitRequests: number;
	pendingLeaveRequests: number;
}

export async function getDepartmentReport(filters: ReportFilters): Promise<DepartmentReportRow[]> {
	const departments = await db.department.findMany({
		where: { ...(filters.departmentId ? { id: filters.departmentId } : {}) },
		orderBy: { name: 'asc' },
		include: { employees: { include: { user: true, benefitRequests: true, leaveRequests: true } } }
	});

	return departments.map((d) => ({
		departmentName: d.name,
		totalEmployees: d.employees.length,
		activeEmployees: d.employees.filter((e) => e.user.isActive).length,
		pendingBenefitRequests: d.employees.reduce(
			(sum, e) => sum + e.benefitRequests.filter((r) => r.status === 'PENDING').length,
			0
		),
		pendingLeaveRequests: d.employees.reduce(
			(sum, e) => sum + e.leaveRequests.filter((r) => r.status === 'PENDING').length,
			0
		)
	}));
}
