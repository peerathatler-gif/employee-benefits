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
		if (form?.created) toast.push('success', t('admin.departments.created'));
		else if (form?.disabled) toast.push('success', t('admin.departments.disabled'));
		else if (form?.reactivated) toast.push('success', t('admin.departments.reactivated'));
	});
</script>

<svelte:head>
	<title>{t('admin.departments.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-6">
	<div>
		<h1 class="text-xl font-semibold text-title">{t('admin.departments.title')}</h1>
		<p class="mt-1 text-sm text-muted">{t('admin.departments.subtitle')}</p>
	</div>

	<form
		method="POST"
		action="?/create"
		use:enhance
		class="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm"
	>
		<FormField
			id="code"
			name="code"
			label={t('admin.departments.code')}
			value={form?.values?.code ?? ''}
			error={form?.errors?.code}
			required
		/>
		<FormField
			id="name"
			name="name"
			label={t('admin.departments.name')}
			value={form?.values?.name ?? ''}
			error={form?.errors?.name}
			required
		/>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
		>
			{t('admin.departments.new')}
		</button>
	</form>

	<DataTable
		headers={[
			t('admin.departments.code'),
			t('admin.departments.name'),
			t('admin.departments.employeeCount'),
			t('common.status'),
			t('common.actions')
		]}
		isEmpty={data.departments.length === 0}
		emptyLabel={t('admin.departments.empty')}
	>
		{#snippet body()}
			{#each data.departments as d (d.id)}
				<tr class="transition hover:bg-brand-soft/30">
					<td
						data-label={t('admin.departments.code')}
						class="px-4 py-3.5 font-mono text-xs text-text">{d.code}</td
					>
					<td data-label={t('admin.departments.name')} class="px-4 py-3.5 font-medium text-text"
						>{d.name}</td
					>
					<td data-label={t('admin.departments.employeeCount')} class="px-4 py-3.5 text-text"
						>{d.employeeCount}</td
					>
					<td data-label={t('common.status')} class="px-4 py-3.5">
						<StatusBadge
							label={d.isActive ? t('common.active') : t('common.inactive')}
							tone={d.isActive ? 'success' : 'neutral'}
						/>
					</td>
					<td data-label={t('common.actions')} class="px-4 py-3.5">
						<div class="flex items-center gap-1">
							<a href={resolve('/admin/departments/[id]', { id: d.id })}>
								<IconActionButton icon={Pencil} label={t('common.edit')} />
							</a>
							{#if d.isActive}
								<form method="POST" action="?/disable" use:enhance>
									<input type="hidden" name="id" value={d.id} />
									<IconActionButton
										icon={Ban}
										label={t('common.disable')}
										tone="danger"
										type="submit"
									/>
								</form>
							{:else}
								<form method="POST" action="?/reactivate" use:enhance>
									<input type="hidden" name="id" value={d.id} />
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
