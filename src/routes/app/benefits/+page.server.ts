import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	getOrCreateCurrentEmployeeBenefit,
	isBenefitWindowOpen,
	pendingRequestedAmount,
	remainingAmount,
	resolveEligibility
} from '$lib/server/benefits';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user!;
	const search = (url.searchParams.get('q') ?? '').trim();
	const categoryId = url.searchParams.get('category') ?? '';

	try {
		const employee = await db.employee.findUnique({ where: { userId: user.id } });
		const categories = await db.benefitCategory.findMany({
			where: { isActive: true },
			orderBy: { name: 'asc' }
		});

		if (!employee) {
			return { employee: null, categories, items: [], dbUnreachable: false, search, categoryId };
		}

		const now = new Date();
		const benefits = await db.benefit.findMany({
			where: {
				isActive: true,
				...(categoryId ? { categoryId } : {}),
				...(search ? { name: { contains: search } } : {})
			},
			include: { category: true },
			orderBy: { name: 'asc' }
		});

		const items = [];
		for (const benefit of benefits) {
			if (!isBenefitWindowOpen(benefit, now)) continue;
			const eligibility = await resolveEligibility(benefit, employee.departmentId, now);
			if (!eligibility.eligible) continue;

			const employeeBenefit = await getOrCreateCurrentEmployeeBenefit(
				employee.id,
				employee.departmentId,
				benefit,
				now
			);
			if (!employeeBenefit) continue;

			const pendingSum = await pendingRequestedAmount(
				employee.id,
				benefit.id,
				employeeBenefit.periodStart
			);

			// `load` return values must be devalue-serializable — Prisma's
			// `Decimal` is not a POJO, so pick only plain fields across to the
			// client instead of spreading the raw Prisma row.
			items.push({
				benefit: {
					id: benefit.id,
					name: benefit.name,
					description: benefit.description,
					category: { id: benefit.category.id, name: benefit.category.name }
				},
				allocatedAmount: Number(employeeBenefit.allocatedAmount),
				usedAmount: Number(employeeBenefit.usedAmount),
				pendingAmount: pendingSum,
				remainingAmount: remainingAmount(employeeBenefit, pendingSum),
				periodStart: employeeBenefit.periodStart,
				periodEnd: employeeBenefit.periodEnd
			});
		}

		return { employee, categories, items, dbUnreachable: false, search, categoryId };
	} catch (err) {
		console.error('[benefits] database unreachable', err);
		return { employee: null, categories: [], items: [], dbUnreachable: true, search, categoryId };
	}
};
