/**
 * Leave-request validation logic shared between `/app/leave/new` (submit)
 * and `/app/leave/[id]` (cancel). Day counts are inclusive calendar days
 * (not business days) — a deliberate simplification documented here rather
 * than silently baked into one call site.
 */
import { db } from './db';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Inclusive day count between two UTC midnight-normalized dates. */
export function inclusiveDayCount(startDate: Date, endDate: Date): number {
	const start = Date.UTC(
		startDate.getUTCFullYear(),
		startDate.getUTCMonth(),
		startDate.getUTCDate()
	);
	const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
	return Math.round((end - start) / MS_PER_DAY) + 1;
}

/**
 * Whether `employeeId` already has a PENDING or APPROVED leave request
 * overlapping [startDate, endDate]. `excludeRequestId` lets a cancel/edit
 * flow check against every OTHER request.
 */
export async function hasOverlappingLeaveRequest(
	employeeId: string,
	startDate: Date,
	endDate: Date,
	excludeRequestId?: string
): Promise<boolean> {
	const count = await db.leaveRequest.count({
		where: {
			employeeId,
			status: { in: ['PENDING', 'APPROVED'] },
			startDate: { lte: endDate },
			endDate: { gte: startDate },
			...(excludeRequestId ? { id: { not: excludeRequestId } } : {})
		}
	});
	return count > 0;
}

/** Remaining days for an employee's leave-type balance in `year` (0 if no balance row exists yet). */
export async function remainingLeaveDays(
	employeeId: string,
	leaveTypeId: string,
	year: number
): Promise<number> {
	const balance = await db.leaveBalance.findUnique({
		where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } }
	});
	if (!balance) return 0;
	return Number(balance.allocatedDays) - Number(balance.usedDays);
}
