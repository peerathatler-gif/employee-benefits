<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { AlertTriangle, IdCard, UserRound } from 'lucide-svelte';
	import FormField from '$lib/components/FormField.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getT();
	const toast = getToastContext();

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmNewPassword = $state('');
	let submittingPassword = $state(false);

	let phone = $state(data.employee?.phone ?? '');
	let submittingProfile = $state(false);

	let avatarInput: HTMLInputElement | undefined = $state();
	let submittingAvatar = $state(false);
	// Cache-bust the avatar <img> on every successful upload so the browser
	// doesn't keep showing the previous image from its own cache.
	let avatarVersion = $state(data.employee?.avatarUrl ?? null);
	const avatarSrc = $derived(
		avatarVersion ? `${resolve('/app/avatar')}?v=${encodeURIComponent(avatarVersion)}` : null
	);

	$effect(() => {
		if (form?.passwordChanged) {
			toast.push('success', t('profile.changePasswordSuccess'));
			currentPassword = '';
			newPassword = '';
			confirmNewPassword = '';
		} else if (form?.profileUpdated) {
			toast.push('success', t('profile.updateProfileSuccess'));
		} else if (form?.avatarUpdated) {
			toast.push('success', t('profile.avatarUpdateSuccess'));
		} else if (form?.formError || form?.profileFormError || form?.avatarFormError) {
			toast.push('error', form.formError ?? form.profileFormError ?? form.avatarFormError ?? '');
		}
	});

	const employmentStatusLabel = $derived(
		data.employee ? t(`employmentStatus.${data.employee.employmentStatus}`) : ''
	);
</script>

<svelte:head>
	<title>{t('profile.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-3xl flex-col gap-6">
	{#if data.dbUnreachable}
		<div
			class="flex items-start gap-2 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
			role="alert"
		>
			<AlertTriangle size={18} class="mt-0.5 shrink-0" aria-hidden="true" />
			<span>{t('common.databaseUnreachable')}</span>
		</div>
	{/if}

	<h1 class="text-xl font-semibold text-title">{t('profile.title')}</h1>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">
			{t('profile.avatarSectionTitle')}
		</h2>
		<div class="flex items-center gap-4">
			<div
				class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background"
			>
				{#if avatarSrc}
					<img src={avatarSrc} alt="" class="h-full w-full object-cover" />
				{:else}
					<UserRound size={28} class="text-muted" aria-hidden="true" />
				{/if}
			</div>
			<form
				method="POST"
				action="?/uploadAvatar"
				enctype="multipart/form-data"
				use:enhance={() => {
					submittingAvatar = true;
					return async ({ update, result }) => {
						await update({ reset: true });
						if (result.type === 'success') {
							avatarVersion = String(Date.now());
						}
						submittingAvatar = false;
					};
				}}
				class="flex items-center gap-3"
			>
				<input
					bind:this={avatarInput}
					type="file"
					name="avatar"
					accept="image/jpeg,image/png,image/webp"
					required
					class="text-sm text-text"
				/>
				<button
					type="submit"
					disabled={submittingAvatar}
					class="rounded-[var(--radius-control)] border border-border px-3 py-2 text-sm font-medium text-text transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
				>
					{submittingAvatar ? t('common.loading') : t('profile.avatarUploadSubmit')}
				</button>
			</form>
		</div>
	</section>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">
			{t('profile.accountSectionTitle')}
		</h2>
		<dl class="grid gap-4 sm:grid-cols-2">
			<div>
				<dt class="text-xs text-muted">{t('profile.emailLabel')}</dt>
				<dd class="mt-0.5 text-sm font-medium text-text">{data.user.email}</dd>
			</div>
			<div>
				<dt class="text-xs text-muted">{t('profile.roleLabel')}</dt>
				<dd class="mt-0.5 text-sm font-medium text-text">{data.user.role}</dd>
			</div>
		</dl>
	</section>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
		<h2
			class="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted uppercase"
		>
			<IdCard size={16} aria-hidden="true" />
			{t('profile.employeeSectionTitle')}
		</h2>

		{#if !data.employee}
			<p class="text-sm text-muted">{t('profile.noEmployeeRecord')}</p>
		{:else}
			<dl class="grid gap-4 sm:grid-cols-2">
				<div>
					<dt class="text-xs text-muted">{t('profile.employeeCodeLabel')}</dt>
					<dd class="mt-0.5 text-sm font-medium text-text">{data.employee.employeeCode}</dd>
				</div>
				<div>
					<dt class="text-xs text-muted">{t('profile.nameLabel')}</dt>
					<dd class="mt-0.5 text-sm font-medium text-text">
						{data.employee.firstName}
						{data.employee.lastName}
					</dd>
				</div>
				<div>
					<dt class="text-xs text-muted">{t('profile.departmentLabel')}</dt>
					<dd class="mt-0.5 text-sm font-medium text-text">{data.employee.department.name}</dd>
				</div>
				<div>
					<dt class="text-xs text-muted">{t('profile.positionLabel')}</dt>
					<dd class="mt-0.5 text-sm font-medium text-text">{data.employee.position.title}</dd>
				</div>
				<div>
					<dt class="text-xs text-muted">{t('profile.hireDateLabel')}</dt>
					<dd class="mt-0.5 text-sm font-medium text-text">{data.formattedHireDate}</dd>
				</div>
				<div>
					<dt class="text-xs text-muted">{t('profile.statusLabel')}</dt>
					<dd class="mt-0.5 text-sm font-medium text-text">{employmentStatusLabel}</dd>
				</div>
			</dl>

			<form
				method="POST"
				action="?/updateProfile"
				use:enhance={() => {
					submittingProfile = true;
					return async ({ update }) => {
						await update();
						submittingProfile = false;
					};
				}}
				class="mt-5 flex flex-col gap-4 border-t border-border pt-5"
			>
				<FormField
					id="phone"
					name="phone"
					type="tel"
					label={t('profile.phoneLabel')}
					bind:value={phone}
					error={form?.profileErrors?.phone}
					autocomplete="tel"
				/>
				<div>
					<button
						type="submit"
						disabled={submittingProfile}
						class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
					>
						{submittingProfile ? t('common.loading') : t('common.save')}
					</button>
				</div>
			</form>
		{/if}
	</section>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">
			{t('profile.passwordSectionTitle')}
		</h2>

		<form
			method="POST"
			action="?/changePassword"
			use:enhance={() => {
				submittingPassword = true;
				return async ({ update }) => {
					await update();
					submittingPassword = false;
				};
			}}
			class="flex flex-col gap-4"
		>
			<FormField
				id="currentPassword"
				name="currentPassword"
				type="password"
				label={t('profile.currentPasswordLabel')}
				bind:value={currentPassword}
				error={form?.errors?.currentPassword}
				required
				autocomplete="current-password"
			/>
			<FormField
				id="newPassword"
				name="newPassword"
				type="password"
				label={t('profile.newPasswordLabel')}
				bind:value={newPassword}
				error={form?.errors?.newPassword}
				required
				autocomplete="new-password"
			/>
			<FormField
				id="confirmNewPassword"
				name="confirmNewPassword"
				type="password"
				label={t('profile.confirmPasswordLabel')}
				bind:value={confirmNewPassword}
				error={form?.errors?.confirmNewPassword}
				required
				autocomplete="new-password"
			/>

			<div>
				<button
					type="submit"
					disabled={submittingPassword}
					class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
				>
					{submittingPassword ? t('common.loading') : t('profile.changePasswordSubmit')}
				</button>
			</div>
		</form>
	</section>
</div>
