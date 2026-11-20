<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { CheckCircle2, Info } from 'lucide-svelte';
	import FormField from '$lib/components/FormField.svelte';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const t = getT();

	let email = $state(form?.email ?? '');
	let submitting = $state(false);
</script>

<svelte:head>
	<title>{t('auth.forgotPassword.title')} · {t('app.name')}</title>
</svelte:head>

<AuthLayout>
	<div class="mb-6 text-center">
		<h1 class="text-xl font-semibold text-title">{t('auth.forgotPassword.title')}</h1>
		<p class="mt-1 text-sm text-muted">{t('auth.forgotPassword.subtitle')}</p>
	</div>

	{#if form?.success}
		<div class="flex flex-col gap-4">
			<div
				class="flex items-start gap-2 rounded-[var(--radius-control)] border border-success/30 bg-success/5 p-3 text-sm text-success"
				role="status"
			>
				<CheckCircle2 size={18} class="mt-0.5 shrink-0" aria-hidden="true" />
				<span>{t('auth.forgotPassword.genericSuccess')}</span>
			</div>

			{#if form.devResetUrl}
				<div
					class="flex flex-col gap-2 rounded-[var(--radius-control)] border border-brand/30 bg-brand-soft p-3 text-sm text-brand-hover"
				>
					<div class="flex items-start gap-2">
						<Info size={18} class="mt-0.5 shrink-0" aria-hidden="true" />
						<div>
							<p class="font-medium">{t('auth.forgotPassword.devModeTitle')}</p>
							<p class="mt-1">{t('auth.forgotPassword.devModeBody')}</p>
						</div>
					</div>
					<!-- Absolute URL built server-side from ORIGIN + a one-time token, not an
							 internal SvelteKit route — resolve() does not apply here. -->
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={form.devResetUrl} class="font-medium break-all underline">{form.devResetUrl}</a>
				</div>
			{/if}

			<a
				href={resolve('/login')}
				class="text-center text-sm font-medium text-brand hover:text-brand-hover"
			>
				{t('auth.forgotPassword.backToLogin')}
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
				id="email"
				name="email"
				type="email"
				label={t('auth.forgotPassword.emailLabel')}
				bind:value={email}
				error={form?.errors?.email}
				required
				autocomplete="email"
			/>

			{#if form?.formError}
				<p class="text-sm text-danger" role="alert">{form.formError}</p>
			{/if}

			<button
				type="submit"
				disabled={submitting}
				class="mt-1 flex items-center justify-center rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
			>
				{submitting ? t('common.loading') : t('auth.forgotPassword.submit')}
			</button>

			<a
				href={resolve('/login')}
				class="text-center text-sm font-medium text-muted hover:text-text"
			>
				{t('auth.forgotPassword.backToLogin')}
			</a>
		</form>
	{/if}
</AuthLayout>
