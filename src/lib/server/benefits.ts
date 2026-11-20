/**
 * Benefit eligibility, period-allocation and remaining-balance logic shared
 * between `/app/benefits` (catalog), `/app/benefits/request` (submit) and
 * `/app/benefits/history` (cancel). Keeping this in one module means the
 * "can this employee request this amount of this benefit right now" rule
 * is defined exactly once.
 */
import type { Benefit, BenefitPolicy, EmployeeBenefit } from '../../generated/prisma/client';
import { db } from './db';

export interface PeriodBounds {
	start: Date;
	end: Date;
}

/** Calendar-based period bounds in UTC, derived from the benefit's periodType. */
export function currentPeriodBounds(
	periodType: Benefit['periodType'],
	now: Date = new Date()
): PeriodBounds {
	const year = now.getUTCFullYear();
	const month = now.getUTCMonth();

	if (periodType === 'MONTHLY') {
		const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
		const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
		return { start, end };
	}

	if (periodType === 'QUARTERLY') {
		const quarterStartMonth = Math.floor(month / 3) * 3;
		const start = new Date(Date.UTC(year, quarterStartMonth, 1, 0, 0, 0, 0));
		const end = new Date(Date.UTC(year, quarterStartMonth + 3, 0, 23, 59, 59, 999));
		return { start, end };
	}

	// YEARLY
	return {
		start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
		end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
	};
}

/** Whether `now` falls within a benefit's open-for-requests window. */
export function isBenefitWindowOpen(benefit: Benefit, now: Date = new Date()): boolean {
	if (!benefit.isActive) return false;
	if (benefit.startDate > now) return false;
	if (benefit.endDate && benefit.endDate < now) return false;
	return true;
}

export type EligibilityResult =
	| { eligible: true; limitAmount: string; policy: BenefitPolicy | null }
	| { eligible: false; limitAmount: null; policy: null };

/**
 * Department-aware eligibility rule:
 *  - An active, in-window, department-specific policy (if any) always wins.
 *  - Otherwise an active, in-window, department-agnostic (`departmentId:
 *    null`) policy applies to every department.
 *  - If neither exists but at least one OTHER department has a
 *    department-specific policy for this benefit, this department is
 *    considered explicitly NOT eligible (the policy list is exhaustive).
 *  - If the benefit has no policies configured at all, it is open to
 *    everyone at `Benefit.defaultLimit` (nothing has restricted it yet).
 */
export async function resolveEligibility(
	benefit: Benefit,
	departmentId: string,
	now: Date = new Date()
): Promise<EligibilityResult> {
	if (!isBenefitWindowOpen(benefit, now)) {
		return { eligible: false, limitAmount: null, policy: null };
	}

	const policies = await db.benefitPolicy.findMany({
		where: {
			benefitId: benefit.id,
			isActive: true,
			effectiveStart: { lte: now },
			OR: [{ effectiveEnd: null }, { effectiveEnd: { gte: now } }]
		}
	});

	if (policies.length === 0) {
		return { eligible: true, limitAmount: benefit.defaultLimit.toString(), policy: null };
	}

	const deptSpecific = policies.find((p) => p.departmentId === departmentId);
	if (deptSpecific) {
		return {
			eligible: true,
			limitAmount: deptSpecific.limitAmount.toString(),
			policy: deptSpecific
		};
	}

	const global = policies.find((p) => p.departmentId === null);
	if (global) {
		return { eligible: true, limitAmount: global.limitAmount.toString(), policy: global };
	}

	// Only department-specific policies exist, and none match this employee.
	return { eligible: false, limitAmount: null, policy: null };
}

/**
 * Finds this employee's `EmployeeBenefit` allocation row for the benefit's
 * CURRENT period, creating it (at the policy/default limit) the first time
 * it is touched. Returns `null` when the employee is not eligible.
 */
export async function getOrCreateCurrentEmployeeBenefit(
	employeeId: string,
	departmentId: string,
	benefit: Benefit,
	now: Date = new Date()
): Promise<EmployeeBenefit | null> {
	const { start, end } = currentPeriodBounds(benefit.periodType, now);

	const existing = await db.employeeBenefit.findUnique({
		where: {
			employeeId_benefitId_periodStart: { employeeId, benefitId: benefit.id, periodStart: start }
		}
	});
	if (existing) return existing;

	const eligibility = await resolveEligibility(benefit, departmentId, now);
	if (!eligibility.eligible) return null;

	return db.employeeBenefit.create({
		data: {
			employeeId,
			benefitId: benefit.id,
			policyId: eligibility.policy?.id ?? null,
			periodStart: start,
			periodEnd: end,
			allocatedAmount: eligibility.limitAmount,
			usedAmount: 0
		}
	});
}

/** Sum of this employee's still-PENDING requests against a benefit's current period. */
export async function pendingRequestedAmount(
	employeeId: string,
	benefitId: string,
	periodStart: Date
): Promise<number> {
	const result = await db.benefitRequest.aggregate({
		where: { employeeId, benefitId, status: 'PENDING', createdAt: { gte: periodStart } },
		_sum: { requestedAmount: true }
	});
	return Number(result._sum.requestedAmount ?? 0);
}

export function remainingAmount(employeeBenefit: EmployeeBenefit, pendingSum: number): number {
	return Number(employeeBenefit.allocatedAmount) - Number(employeeBenefit.usedAmount) - pendingSum;
}
