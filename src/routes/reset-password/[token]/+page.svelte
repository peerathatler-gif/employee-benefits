<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { AlertCircle, CheckCircle2 } from 'lucide-svelte';
	import FormField from '$lib/components/FormField.svelte';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getT();

	let password = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);

	const tokenInvalid = $derived(!data.valid || form?.tokenInvalid === true);
</script>

<svelte:head>
	<title>{t('auth.resetPassword.title')} · {t('app.name')}</title>
</svelte:head>

<AuthLayout>
	<h1 class="mb-6 text-center text-xl font-semibold text-title">
		{t('auth.resetPassword.title')}
	</h1>

	{#if form?.success}
		<div class="flex flex-col gap-4">
			<div
				class="flex items-start gap-2 rounded-[var(--radius-control)] border border-success/30 bg-success/5 p-3 text-sm text-success"
				role="status"
			>
				<CheckCircle2 size={18} class="mt-0.5 shrink-0" aria-hidden="true" />
				<span>{t('auth.resetPassword.success')}</span>
			</div>
			<a
				href={resolve('/login')}
				class="flex items-center justify-center rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>
				{t('auth.login.submit')}
			</a>
		</div>
	{:else if tokenInvalid}
		<div class="flex flex-col gap-4">
			<div
				class="flex items-start gap-2 rounded-[var(--radius-control)] border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
				role="alert"
			>
				<AlertCircle size={18} class="mt-0.5 shrink-0" aria-hidden="true" />
				<span>{form?.formError ?? t('auth.resetPassword.invalidToken')}</span>
			</div>
			<a
				href={resolve('/forgot-password')}
				class="text-center text-sm font-medium text-brand hover:text-brand-hover"
			>
				{t('auth.resetPassword.requestNewLink')}
			</a>
		</div>
	{:else}
		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="flex flex-col gap-4"
		>
			<FormField
				id="password"
				name="password"
				type="password"
				label={t('auth.resetPassword.newPasswordLabel')}
				bind:value={password}
				error={form?.errors?.password}
				required
				autocomplete="new-password"
			/>
			<FormField
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				label={t('auth.resetPassword.confirmPasswordLabel')}
				bind:value={confirmPassword}
				error={form?.errors?.confirmPassword}
				required
				autocomplete="new-password"
			/>

			{#if form?.formError}
				<p class="text-sm text-danger" role="alert">{form.formError}</p>
			{/if}

			<button
				type="submit"
				disabled={submitting}
				class="mt-1 flex items-center justify-center rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
			>
				{submitting ? t('common.loading') : t('auth.resetPassword.submit')}
			</button>
		</form>
	{/if}
</AuthLayout>
