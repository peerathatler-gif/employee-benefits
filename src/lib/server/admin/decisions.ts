/**
 * Approve/reject decisions for `BenefitRequest`/`LeaveRequest`.
 *
 * Concurrency: each decision runs inside ONE Prisma interactive transaction
 * that
 *   1) atomically increments the balance row with a WHERE clause that
 *      re-checks "allocated - used >= amount" IN THE SAME UPDATE statement
 *      (`$executeRaw` — InnoDB takes the row lock as part of evaluating that
 *      UPDATE, so a second concurrent UPDATE on the same row blocks until
 *      the first commits, then re-evaluates against the now-current value —
 *      this is what actually prevents a double-spend, not just a check
 *      before a separate write), then
 *   2) atomically flips the request's status with `updateMany({ where: {
 *      status: 'PENDING' } })` — the same "ownership + state in the WHERE
 *      clause" pattern already used by the employee-facing cancel actions.
 * If step 2 finds the request was already decided (count === 0) by a
 * request that raced ahead of us, we throw to roll back step 1's balance
 * increment too, so nothing is left half-applied.
 */
import { db } from '../db';
import { currentPeriodBounds } from '../benefits';

export type DecisionResult =
	| { ok: true; employeeUserId: string }
	| {
			ok: false;
			reason: 'not-found' | 'already-decided' | 'insufficient-balance' | 'no-allocation';
	  };

const CONCURRENT_DECISION = 'CONCURRENT_DECISION';

export async function approveBenefitRequest(
	requestId: string,
	adminUserId: string
): Promise<DecisionResult> {
	try {
		return await db.$transaction(async (tx) => {
			const request = await tx.benefitRequest.findUnique({
				where: { id: requestId },
				include: { benefit: true, employee: { select: { userId: true } } }
			});
			if (!request) return { ok: false, reason: 'not-found' as const };
			if (request.status !== 'PENDING') return { ok: false, reason: 'already-decided' as const };

			const periodStart = currentPeriodBounds(request.benefit.periodType, request.createdAt).start;
			const employeeBenefit = await tx.employeeBenefit.findUnique({
				where: {
					employeeId_benefitId_periodStart: {
						employeeId: request.employeeId,
						benefitId: request.benefitId,
						periodStart
					}
				}
			});
			if (!employeeBenefit) return { ok: false, reason: 'no-allocation' as const };

			const amount = request.requestedAmount.toString();
			const affected: number = await tx.$executeRaw`
				UPDATE employee_benefits
				SET usedAmount = usedAmount + ${amount}, updatedAt = NOW()
				WHERE id = ${employeeBenefit.id} AND (allocatedAmount - usedAmount) >= ${amount}
			`;
			if (affected === 0) return { ok: false, reason: 'insufficient-balance' as const };

			const statusUpdate = await tx.benefitRequest.updateMany({
				where: { id: requestId, status: 'PENDING' },
				data: { status: 'APPROVED', reviewedById: adminUserId, reviewedAt: new Date() }
			});
			if (statusUpdate.count === 0) throw new Error(CONCURRENT_DECISION);

			await tx.auditLog.create({
				data: {
					actorUserId: adminUserId,
					action: 'BENEFIT_REQUEST_APPROVED',
					entityType: 'BenefitRequest',
					entityId: requestId,
					metadataJson: JSON.stringify({ amount: request.requestedAmount.toString() })
				}
			});
			await tx.notification.create({
				data: {
					userId: request.employee.userId,
					title: 'คำขอสวัสดิการของคุณได้รับการอนุมัติ / Your benefit request was approved',
					body: `คำขอ "${request.benefit.name}" จำนวน ${request.requestedAmount.toString()} ได้รับการอนุมัติแล้ว / Your request for "${request.benefit.name}" (${request.requestedAmount.toString()}) has been approved.`
				}
			});

			return { ok: true as const, employeeUserId: request.employee.userId };
		});
	} catch (err) {
		if (err instanceof Error && err.message === CONCURRENT_DECISION) {
			return { ok: false, reason: 'already-decided' };
		}
		throw err;
	}
}

export async function rejectBenefitRequest(
	requestId: string,
	adminUserId: string,
	reason: string
): Promise<DecisionResult> {
	return db.$transaction(async (tx) => {
		const request = await tx.benefitRequest.findUnique({
			where: { id: requestId },
			include: { benefit: true, employee: { select: { userId: true } } }
		});
		if (!request) return { ok: false, reason: 'not-found' as const };

		const statusUpdate = await tx.benefitRequest.updateMany({
			where: { id: requestId, status: 'PENDING' },
			data: {
				status: 'REJECTED',
				reviewedById: adminUserId,
				reviewedAt: new Date(),
				rejectionReason: reason
			}
		});
		if (statusUpdate.count === 0) return { ok: false, reason: 'already-decided' as const };

		await tx.auditLog.create({
			data: {
				actorUserId: adminUserId,
				action: 'BENEFIT_REQUEST_REJECTED',
				entityType: 'BenefitRequest',
				entityId: requestId,
				metadataJson: JSON.stringify({ reason })
			}
		});
		await tx.notification.create({
			data: {
				userId: request.employee.userId,
				title: 'คำขอสวัสดิการของคุณถูกปฏิเสธ / Your benefit request was rejected',
				body: `คำขอ "${request.benefit.name}" ถูกปฏิเสธ: ${reason} / Your request for "${request.benefit.name}" was rejected: ${reason}`
			}
		});

		return { ok: true as const, employeeUserId: request.employee.userId };
	});
}

export async function approveLeaveRequest(
	requestId: string,
	adminUserId: string
): Promise<DecisionResult> {
	try {
		return await db.$transaction(async (tx) => {
			const request = await tx.leaveRequest.findUnique({
				where: { id: requestId },
				include: { leaveType: true, employee: { select: { userId: true } } }
			});
			if (!request) return { ok: false, reason: 'not-found' as const };
			if (request.status !== 'PENDING') return { ok: false, reason: 'already-decided' as const };

			const year = request.startDate.getUTCFullYear();
			const balance = await tx.leaveBalance.findUnique({
				where: {
					employeeId_leaveTypeId_year: {
						employeeId: request.employeeId,
						leaveTypeId: request.leaveTypeId,
						year
					}
				}
			});
			if (!balance) return { ok: false, reason: 'no-allocation' as const };

			const days = request.totalDays.toString();
			const affected: number = await tx.$executeRaw`
				UPDATE leave_balances
				SET usedDays = usedDays + ${days}, updatedAt = NOW()
				WHERE id = ${balance.id} AND (allocatedDays - usedDays) >= ${days}
			`;
			if (affected === 0) return { ok: false, reason: 'insufficient-balance' as const };

			const statusUpdate = await tx.leaveRequest.updateMany({
				where: { id: requestId, status: 'PENDING' },
				data: { status: 'APPROVED', reviewedById: adminUserId, reviewedAt: new Date() }
			});
			if (statusUpdate.count === 0) throw new Error(CONCURRENT_DECISION);

			await tx.auditLog.create({
				data: {
					actorUserId: adminUserId,
					action: 'LEAVE_REQUEST_APPROVED',
					entityType: 'LeaveRequest',
					entityId: requestId,
					metadataJson: JSON.stringify({ days: request.totalDays.toString() })
				}
			});
			await tx.notification.create({
				data: {
					userId: request.employee.userId,
					title: 'คำขอลาของคุณได้รับการอนุมัติ / Your leave request was approved',
					body: `คำขอลา "${request.leaveType.name}" (${request.totalDays.toString()} วัน) ได้รับการอนุมัติแล้ว / Your "${request.leaveType.name}" leave request (${request.totalDays.toString()} days) has been approved.`
				}
			});

			return { ok: true as const, employeeUserId: request.employee.userId };
		});
	} catch (err) {
		if (err instanceof Error && err.message === CONCURRENT_DECISION) {
			return { ok: false, reason: 'already-decided' };
		}
		throw err;
	}
}

export async function rejectLeaveRequest(
	requestId: string,
	adminUserId: string,
	reason: string
): Promise<DecisionResult> {
	return db.$transaction(async (tx) => {
		const request = await tx.leaveRequest.findUnique({
			where: { id: requestId },
			include: { leaveType: true, employee: { select: { userId: true } } }
		});
		if (!request) return { ok: false, reason: 'not-found' as const };

		const statusUpdate = await tx.leaveRequest.updateMany({
			where: { id: requestId, status: 'PENDING' },
			data: {
				status: 'REJECTED',
				reviewedById: adminUserId,
				reviewedAt: new Date(),
				rejectionReason: reason
			}
		});
		if (statusUpdate.count === 0) return { ok: false, reason: 'already-decided' as const };

		await tx.auditLog.create({
			data: {
				actorUserId: adminUserId,
				action: 'LEAVE_REQUEST_REJECTED',
				entityType: 'LeaveRequest',
				entityId: requestId,
				metadataJson: JSON.stringify({ reason })
			}
		});
		await tx.notification.create({
			data: {
				userId: request.employee.userId,
				title: 'คำขอลาของคุณถูกปฏิเสธ / Your leave request was rejected',
				body: `คำขอลา "${request.leaveType.name}" ถูกปฏิเสธ: ${reason} / Your "${request.leaveType.name}" leave request was rejected: ${reason}`
			}
		});

		return { ok: true as const, employeeUserId: request.employee.userId };
	});
}
