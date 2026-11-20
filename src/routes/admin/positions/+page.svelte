<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Pencil, Ban, RotateCcw } from 'lucide-svelte';
	import FormField from '$lib/components/FormField.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import IconActionButton from '$lib/components/IconActionButton.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	$effect(() => {
		if (form?.created) toast.push('success', t('admin.positions.created'));
		else if (form?.disabled) toast.push('success', t('admin.positions.disabled'));
		else if (form?.reactivated) toast.push('success', t('admin.positions.reactivated'));
	});
</script>

<svelte:head>
	<title>{t('admin.positions.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-6">
	<div>
		<h1 class="text-xl font-semibold text-title">{t('admin.positions.title')}</h1>
		<p class="mt-1 text-sm text-muted">{t('admin.positions.subtitle')}</p>
	</div>

	<form
		method="POST"
		action="?/create"
		use:enhance
		class="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm"
	>
		<div class="flex flex-col gap-1.5">
			<label for="departmentId" class="text-sm font-medium text-title"
				>{t('admin.positions.department')}</label
			>
			<select
				id="departmentId"
				name="departmentId"
				required
				class="rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
			>
				<option value="" disabled selected>{t('admin.positions.department')}</option>
				{#each data.departments as d (d.id)}
					<option value={d.id}>{d.name}</option>
				{/each}
			</select>
		</div>
		<FormField
			id="code"
			name="code"
			label={t('admin.positions.code')}
			value={form?.values?.code ?? ''}
			error={form?.errors?.code}
			required
		/>
		<FormField
			id="title"
			name="title"
			label={t('admin.positions.titleLabel')}
			value={form?.values?.title ?? ''}
			error={form?.errors?.title}
			required
		/>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
		>
			{t('admin.positions.new')}
		</button>
	</form>

	<DataTable
		headers={[
			t('admin.positions.code'),
			t('admin.positions.titleLabel'),
			t('admin.positions.department'),
			t('admin.positions.employeeCount'),
			t('common.status'),
			t('common.actions')
		]}
		isEmpty={data.positions.length === 0}
		emptyLabel={t('admin.positions.empty')}
	>
		{#snippet body()}
			{#each data.positions as p (p.id)}
				<tr class="transition hover:bg-brand-soft/30">
					<td data-label={t('admin.positions.code')} class="px-4 py-3.5 font-mono text-xs text-text"
						>{p.code}</td
					>
					<td data-label={t('admin.positions.titleLabel')} class="px-4 py-3.5 font-medium text-text"
						>{p.title}</td
					>
					<td data-label={t('admin.positions.department')} class="px-4 py-3.5 text-text"
						>{p.departmentName}</td
					>
					<td data-label={t('admin.positions.employeeCount')} class="px-4 py-3.5 text-text"
						>{p.employeeCount}</td
					>
					<td data-label={t('common.status')} class="px-4 py-3.5">
						<StatusBadge
							label={p.isActive ? t('common.active') : t('common.inactive')}
							tone={p.isActive ? 'success' : 'neutral'}
						/>
					</td>
					<td data-label={t('common.actions')} class="px-4 py-3.5">
						<div class="flex items-center gap-1">
							<a href={resolve('/admin/positions/[id]', { id: p.id })}>
								<IconActionButton icon={Pencil} label={t('common.edit')} />
							</a>
							{#if p.isActive}
								<form method="POST" action="?/disable" use:enhance>
									<input type="hidden" name="id" value={p.id} />
									<IconActionButton
										icon={Ban}
										label={t('common.disable')}
										tone="danger"
										type="submit"
									/>
								</form>
							{:else}
								<form method="POST" action="?/reactivate" use:enhance>
									<input type="hidden" name="id" value={p.id} />
									<IconActionButton
										icon={RotateCcw}
										label={t('common.reactivate')}
										tone="success"
										type="submit"
									/>
								</form>
							{/if}
						</div>
					</td>
				</tr>
			{/each}
		{/snippet}
	</DataTable>
</div>
