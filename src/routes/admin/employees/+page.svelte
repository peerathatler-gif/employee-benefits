<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Search, Plus, Copy, Pencil, Ban, RotateCcw, KeyRound } from 'lucide-svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import IconActionButton from '$lib/components/IconActionButton.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	let revealedPassword = $state<string | null>(null);

	$effect(() => {
		if (form?.disabled) toast.push('success', t('admin.employees.disabled'));
		else if (form?.reactivated) toast.push('success', t('admin.employees.reactivated'));
		else if (form?.oneTimePassword) revealedPassword = form.oneTimePassword;
		else if (form?.formError) toast.push('error', form.formError);
	});

	async function copyPassword() {
		if (!revealedPassword) return;
		try {
			await navigator.clipboard.writeText(revealedPassword);
			toast.push('success', t('common.saved'));
		} catch {
			// Clipboard API unavailable — the password is still shown on screen.
		}
	}
</script>

<svelte:head>
	<title>{t('admin.employees.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-6xl flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-xl font-semibold text-title">{t('admin.employees.title')}</h1>
			<p class="mt-1 text-sm text-muted">{t('admin.employees.subtitle')}</p>
		</div>
		<a
			href={resolve('/admin/employees/new')}
			class="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
		>
			<Plus size={16} aria-hidden="true" />
			{t('admin.employees.new')}
		</a>
	</div>

	{#if revealedPassword}
		<section
			class="rounded-[var(--radius-card)] border border-brand/40 bg-brand-soft/60 p-5 shadow-sm"
		>
			<p class="text-sm font-medium text-title">{t('admin.employees.oneTimePasswordNote')}</p>
			<div class="mt-3 flex items-center gap-2">
				<code
					class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm"
				>
					{revealedPassword}
				</code>
				<button
					type="button"
					onclick={copyPassword}
					class="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-border px-3 py-2 text-xs font-semibold text-text hover:border-brand hover:text-brand"
				>
					<Copy size={14} aria-hidden="true" />
					{t('common.save')}
				</button>
				<button
					type="button"
					onclick={() => (revealedPassword = null)}
					class="text-xs font-semibold text-muted hover:text-text"
				>
					{t('common.close')}
				</button>
			</div>
		</section>
	{/if}

	<form method="GET" class="flex flex-wrap items-end gap-3">
		<div class="relative min-w-[220px] flex-1">
			<Search
				size={16}
				class="absolute top-1/2 left-3 -translate-y-1/2 text-muted"
				aria-hidden="true"
			/>
			<input
				type="search"
				name="q"
				value={data.filters.q}
				placeholder={t('admin.employees.searchPlaceholder')}
				class="w-full rounded-[var(--radius-control)] border border-border bg-surface py-2.5 pr-3 pl-9 text-sm text-text"
			/>
		</div>
		<select
			name="departmentId"
			value={data.filters.departmentId}
			class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		>
			<option value="">{t('admin.employees.allDepartments')}</option>
			{#each data.departments as d (d.id)}
				<option value={d.id}>{d.name}</option>
			{/each}
		</select>
		<select
			name="employmentStatus"
			value={data.filters.employmentStatus}
			class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		>
			<option value="">{t('admin.employees.allStatuses')}</option>
			<option value="ACTIVE">{t('employmentStatus.ACTIVE')}</option>
			<option value="ON_LEAVE">{t('employmentStatus.ON_LEAVE')}</option>
			<option value="SUSPENDED">{t('employmentStatus.SUSPENDED')}</option>
			<option value="TERMINATED">{t('employmentStatus.TERMINATED')}</option>
		</select>
		<select
			name="accountStatus"
			value={data.filters.accountStatus}
			class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		>
			<option value="">{t('common.all')}</option>
			<option value="ACTIVE">{t('common.active')}</option>
			<option value="INACTIVE">{t('common.inactive')}</option>
		</select>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>{t('common.search')}</button
		>
	</form>

	<DataTable
		headers={[
			t('admin.employees.name'),
			t('admin.employees.department'),
			t('admin.employees.position'),
			t('admin.employees.status'),
			t('admin.employees.accountStatus'),
			t('common.actions')
		]}
		isEmpty={data.employees.length === 0}
		emptyLabel={t('admin.employees.empty')}
	>
		{#snippet body()}
			{#each data.employees as e (e.id)}
				<tr class="transition hover:bg-brand-soft/30">
					<td data-label={t('admin.employees.name')} class="px-4 py-3.5">
						<a
							href={resolve('/admin/employees/[id]', { id: e.id })}
							class="group flex items-center gap-3"
						>
							<Avatar name={`${e.firstName} ${e.lastName}`} src={e.avatarSrc} />
							<span class="flex flex-col leading-tight">
								<span class="font-medium text-text group-hover:text-brand"
									>{e.firstName} {e.lastName}</span
								>
								<span class="text-xs text-muted">{e.email} &middot; {e.employeeCode}</span>
							</span>
						</a>
					</td>
					<td data-label={t('admin.employees.department')} class="px-4 py-3.5 text-text"
						>{e.departmentName}</td
					>
					<td data-label={t('admin.employees.position')} class="px-4 py-3.5 text-text"
						>{e.positionTitle}</td
					>
					<td data-label={t('admin.employees.status')} class="px-4 py-3.5">
						<StatusBadge
							label={t(`employmentStatus.${e.employmentStatus}`)}
							tone={e.employmentStatus === 'ACTIVE'
								? 'success'
								: e.employmentStatus === 'ON_LEAVE'
									? 'info'
									: e.employmentStatus === 'SUSPENDED'
										? 'warning'
										: 'danger'}
						/>
					</td>
					<td data-label={t('admin.employees.accountStatus')} class="px-4 py-3.5">
						<StatusBadge
							label={e.isActive ? t('common.active') : t('common.inactive')}
							tone={e.isActive ? 'success' : 'neutral'}
						/>
					</td>
					<td data-label={t('common.actions')} class="px-4 py-3.5">
						<div class="flex items-center gap-1">
							<a href={resolve('/admin/employees/[id]', { id: e.id })} title={t('common.edit')}>
								<IconActionButton icon={Pencil} label={t('common.edit')} />
							</a>
							{#if e.isActive}
								<form
									method="POST"
									action="?/disable"
									use:enhance
									onsubmit={(ev) => {
										if (!confirm(t('admin.employees.disableConfirm'))) ev.preventDefault();
									}}
								>
									<input type="hidden" name="employeeId" value={e.id} />
									<IconActionButton
										icon={Ban}
										label={t('common.disable')}
										tone="danger"
										type="submit"
									/>
								</form>
							{:else}
								<form method="POST" action="?/reactivate" use:enhance>
									<input type="hidden" name="employeeId" value={e.id} />
									<IconActionButton
										icon={RotateCcw}
										label={t('common.reactivate')}
										tone="success"
										type="submit"
									/>
								</form>
							{/if}
							<form
								method="POST"
								action="?/resetPassword"
								use:enhance
								onsubmit={(ev) => {
									if (!confirm(t('admin.employees.resetPasswordConfirm'))) ev.preventDefault();
								}}
							>
								<input type="hidden" name="employeeId" value={e.id} />
								<IconActionButton
									icon={KeyRound}
									label={t('admin.employees.resetPassword')}
									type="submit"
								/>
							</form>
						</div>
					</td>
				</tr>
			{/each}
		{/snippet}
	</DataTable>

	{#if data.totalPages > 1}
		<div class="flex items-center justify-between text-sm text-muted">
			<span>{t('common.page', { current: data.page, total: data.totalPages })}</span>
			<div class="flex gap-2">
				{#if data.page > 1}
					<a
						href="{resolve('/admin/employees')}?{new URLSearchParams({
							...data.filters,
							page: String(data.page - 1)
						})}"
						class="rounded-[var(--radius-control)] border border-border px-3 py-1.5 hover:border-brand hover:text-brand"
						>{t('common.previous')}</a
					>
				{/if}
				{#if data.page < data.totalPages}
					<a
						href="{resolve('/admin/employees')}?{new URLSearchParams({
							...data.filters,
							page: String(data.page + 1)
						})}"
						class="rounded-[var(--radius-control)] border border-border px-3 py-1.5 hover:border-brand hover:text-brand"
						>{t('common.next')}</a
					>
				{/if}
			</div>
		</div>
	{/if}
</div>
