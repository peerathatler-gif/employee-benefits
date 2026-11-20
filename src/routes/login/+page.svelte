<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { AlertCircle } from 'lucide-svelte';
	import FormField from '$lib/components/FormField.svelte';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getT();

	let email = $state(form?.email ?? '');
	let password = $state('');
	let submitting = $state(false);
</script>

<svelte:head>
	<title>{t('auth.login.title')} · {t('app.name')}</title>
</svelte:head>

<AuthLayout>
	<div class="mb-8">
		<h1 class="text-2xl font-bold tracking-tight text-title">{t('auth.login.title')}</h1>
		<p class="mt-1.5 text-sm text-muted">{t('auth.login.subtitle')}</p>
	</div>

	{#if form?.formError}
		<div
			class="mb-4 flex items-start gap-2 rounded-[var(--radius-control)] border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
			role="alert"
		>
			<AlertCircle size={18} class="mt-0.5 shrink-0" aria-hidden="true" />
			<span>{form.formError}</span>
		</div>
	{/if}

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
		<input type="hidden" name="redirectTo" value={data.redirectTo ?? ''} />

		<FormField
			id="email"
			name="email"
			type="text"
			label={t('auth.login.identifierLabel')}
			bind:value={email}
			error={form?.errors?.email}
			required
			autocomplete="username"
		/>

		<FormField
			id="password"
			name="password"
			type="password"
			label={t('auth.login.passwordLabel')}
			bind:value={password}
			error={form?.errors?.password}
			required
			autocomplete="current-password"
		/>

		<div class="flex justify-end">
			<a
				href={resolve('/forgot-password')}
				class="text-sm font-medium text-brand hover:text-brand-hover"
			>
				{t('auth.login.forgotPassword')}
			</a>
		</div>

		<button
			type="submit"
			disabled={submitting}
			class="bg-brand-gradient mt-2 flex items-center justify-center rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-brand-hover hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{submitting ? t('common.loading') : t('auth.login.submit')}
		</button>
	</form>
</AuthLayout>
