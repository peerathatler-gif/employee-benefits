<script lang="ts">
	import { resolve } from '$app/paths';
	import { getT } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const t = getT();

	function formatMoney(amount: string | number): string {
		return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
			Number(amount)
		);
	}

	// Query string only — the `resolve('/api/admin/reports/export')` call
	// lives directly in each `href` below (first attribute segment) so
	// `svelte/no-navigation-without-resolve` can see it; this helper just
	// supplies the `?...` part that follows it.
	function exportQuery(type: string): string {
		const params = new URLSearchParams({
			type,
			dateFrom: data.filters.dateFrom,
			dateTo: data.filters.dateTo,
			departmentId: data.filters.departmentId
		});
		return params.toString();
	}
</script>

<svelte:head>
	<title>{t('admin.reports.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-6xl flex-col gap-6">
	<div>
		<h1 class="text-xl font-semibold text-title">{t('admin.reports.title')}</h1>
		<p class="mt-1 text-sm text-muted">{t('admin.reports.subtitle')}</p>
	</div>

	<form method="GET" class="flex flex-wrap items-end gap-3">
		<div class="flex flex-col gap-1.5">
			<label for="dateFrom" class="text-xs text-muted">{t('admin.reports.dateFrom')}</label>
			<input
				id="dateFrom"
				type="date"
				name="dateFrom"
				value={data.filters.dateFrom}
				class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-text"
			/>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="dateTo" class="text-xs text-muted">{t('admin.reports.dateTo')}</label>
			<input
				id="dateTo"
				type="date"
				name="dateTo"
				value={data.filters.dateTo}
				class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-text"
			/>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="departmentId" class="text-xs text-muted">{t('admin.reports.department')}</label>
			<select
				id="departmentId"
				name="departmentId"
				value={data.filters.departmentId}
				class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-text"
			>
				<option value="">{t('common.all')}</option>
				{#each data.departments as d (d.id)}
					<option value={d.id}>{d.name}</option>
				{/each}
			</select>
		</div>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>{t('common.filter')}</button
		>
	</form>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-title">{t('admin.reports.employeeReport')}</h2>
			<a
				href="{resolve('/api/admin/reports/export')}?{exportQuery('employee')}"
				class="text-xs font-semibold text-brand hover:text-brand-hover"
				>{t('admin.reports.exportCsv')}</a
			>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-border text-xs text-muted">
					<tr>
						<th class="px-2 py-2">{t('admin.employees.code')}</th>
						<th class="px-2 py-2">{t('admin.employees.name')}</th>
						<th class="px-2 py-2">{t('admin.employees.department')}</th>
						<th class="px-2 py-2">{t('admin.employees.status')}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.employeeReport as r (r.employeeCode)}
						<tr class="border-b border-border last:border-0">
							<td class="px-2 py-2 font-mono text-xs">{r.employeeCode}</td>
							<td class="px-2 py-2">{r.name}</td>
							<td class="px-2 py-2">{r.department}</td>
							<td class="px-2 py-2">{t(`employmentStatus.${r.employmentStatus}`)}</td>
						</tr>
					{:else}
						<tr
							><td colspan="4" class="px-2 py-6 text-center text-muted"
								>{t('admin.reports.noData')}</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-title">{t('admin.reports.benefitUsageReport')}</h2>
			<a
				href="{resolve('/api/admin/reports/export')}?{exportQuery('benefit')}"
				class="text-xs font-semibold text-brand hover:text-brand-hover"
				>{t('admin.reports.exportCsv')}</a
			>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-border text-xs text-muted">
					<tr>
						<th class="px-2 py-2">{t('admin.benefitCatalog.name')}</th>
						<th class="px-2 py-2">{t('admin.benefitCatalog.category')}</th>
						<th class="px-2 py-2">{t('requests.statusApproved')}</th>
						<th class="px-2 py-2">{t('common.actions')}</th>
						<th class="px-2 py-2">{t('requests.statusPending')}</th>
						<th class="px-2 py-2">{t('requests.statusRejected')}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.benefitUsageReport as r (r.benefitName)}
						<tr class="border-b border-border last:border-0">
							<td class="px-2 py-2">{r.benefitName}</td>
							<td class="px-2 py-2">{r.category}</td>
							<td class="px-2 py-2">{r.approvedCount}</td>
							<td class="px-2 py-2">{formatMoney(r.approvedAmount)}</td>
							<td class="px-2 py-2">{r.pendingCount}</td>
							<td class="px-2 py-2">{r.rejectedCount}</td>
						</tr>
					{:else}
						<tr
							><td colspan="6" class="px-2 py-6 text-center text-muted"
								>{t('admin.reports.noData')}</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-title">{t('admin.reports.leaveReport')}</h2>
			<a
				href="{resolve('/api/admin/reports/export')}?{exportQuery('leave')}"
				class="text-xs font-semibold text-brand hover:text-brand-hover"
				>{t('admin.reports.exportCsv')}</a
			>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-border text-xs text-muted">
					<tr>
						<th class="px-2 py-2">{t('leave.typeLabel')}</th>
						<th class="px-2 py-2">{t('requests.statusApproved')}</th>
						<th class="px-2 py-2">{t('leave.totalDaysLabel')}</th>
						<th class="px-2 py-2">{t('requests.statusPending')}</th>
						<th class="px-2 py-2">{t('requests.statusRejected')}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.leaveReport as r (r.leaveTypeName)}
						<tr class="border-b border-border last:border-0">
							<td class="px-2 py-2">{r.leaveTypeName}</td>
							<td class="px-2 py-2">{r.approvedCount}</td>
							<td class="px-2 py-2">{r.approvedDays}</td>
							<td class="px-2 py-2">{r.pendingCount}</td>
							<td class="px-2 py-2">{r.rejectedCount}</td>
						</tr>
					{:else}
						<tr
							><td colspan="5" class="px-2 py-6 text-center text-muted"
								>{t('admin.reports.noData')}</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-title">{t('admin.reports.pendingRequestsReport')}</h2>
			<a
				href="{resolve('/api/admin/reports/export')}?{exportQuery('pending')}"
				class="text-xs font-semibold text-brand hover:text-brand-hover"
				>{t('admin.reports.exportCsv')}</a
			>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-border text-xs text-muted">
					<tr>
						<th class="px-2 py-2">{t('common.code')}</th>
						<th class="px-2 py-2">{t('admin.employees.name')}</th>
						<th class="px-2 py-2">{t('common.description')}</th>
						<th class="px-2 py-2">{t('admin.benefitRequests.submitted')}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.pendingRequestsReport as r (r.employeeCode + r.submittedAt)}
						<tr class="border-b border-border last:border-0">
							<td class="px-2 py-2 font-mono text-xs">{r.employeeCode}</td>
							<td class="px-2 py-2">{r.employeeName}</td>
							<td class="px-2 py-2">{r.detail}</td>
							<td class="px-2 py-2"
								>{new Intl.DateTimeFormat('en-CA').format(new Date(r.submittedAt))}</td
							>
						</tr>
					{:else}
						<tr
							><td colspan="4" class="px-2 py-6 text-center text-muted"
								>{t('admin.reports.noData')}</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-title">{t('admin.reports.departmentReport')}</h2>
			<a
				href="{resolve('/api/admin/reports/export')}?{exportQuery('department')}"
				class="text-xs font-semibold text-brand hover:text-brand-hover"
				>{t('admin.reports.exportCsv')}</a
			>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-border text-xs text-muted">
					<tr>
						<th class="px-2 py-2">{t('admin.departments.name')}</th>
						<th class="px-2 py-2">{t('admin.dashboard.totalEmployees')}</th>
						<th class="px-2 py-2">{t('admin.dashboard.activeEmployees')}</th>
						<th class="px-2 py-2">{t('admin.dashboard.pendingBenefits')}</th>
						<th class="px-2 py-2">{t('admin.dashboard.pendingLeave')}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.departmentReport as r (r.departmentName)}
						<tr class="border-b border-border last:border-0">
							<td class="px-2 py-2">{r.departmentName}</td>
							<td class="px-2 py-2">{r.totalEmployees}</td>
							<td class="px-2 py-2">{r.activeEmployees}</td>
							<td class="px-2 py-2">{r.pendingBenefitRequests}</td>
							<td class="px-2 py-2">{r.pendingLeaveRequests}</td>
						</tr>
					{:else}
						<tr
							><td colspan="5" class="px-2 py-6 text-center text-muted"
								>{t('admin.reports.noData')}</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</div>
