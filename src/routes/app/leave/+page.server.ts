import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const employee = await db.employee.findUnique({ where: { userId: user.id } });

	if (!employee) {
		return { employee: null, balances: [], requests: [] };
	}

	const currentYear = new Date().getUTCFullYear();

	const [balances, requests] = await Promise.all([
		db.leaveBalance.findMany({
			where: { employeeId: employee.id, year: currentYear },
			include: { leaveType: true },
			orderBy: { leaveType: { name: 'asc' } }
		}),
		db.leaveRequest.findMany({
			where: { employeeId: employee.id },
			include: { leaveType: true },
			orderBy: { createdAt: 'desc' },
			take: 20
		})
	]);

	// `load` return values must be devalue-serializable — Prisma's `Decimal`
	// is not a POJO, so convert day-count fields to plain numbers here.
	const serializedBalances = balances.map((b) => ({
		...b,
		allocatedDays: Number(b.allocatedDays),
		usedDays: Number(b.usedDays),
		leaveType: { id: b.leaveType.id, name: b.leaveType.name }
	}));
	const serializedRequests = requests.map((r) => ({
		...r,
		totalDays: Number(r.totalDays),
		leaveType: { id: r.leaveType.id, name: r.leaveType.name }
	}));

	return { employee, balances: serializedBalances, requests: serializedRequests };
};
