<script lang="ts">
	import { Eye, EyeOff } from 'lucide-svelte';
	import { getT } from '$lib/i18n';

	interface Props {
		id: string;
		name: string;
		label: string;
		type?: 'text' | 'email' | 'password' | 'tel' | 'date';
		value: string;
		error?: string | null;
		required?: boolean;
		autocomplete?: string;
		placeholder?: string;
		disabled?: boolean;
	}

	let {
		id,
		name,
		label,
		type = 'text',
		value = $bindable(''),
		error = null,
		required = false,
		autocomplete,
		placeholder,
		disabled = false
	}: Props = $props();

	const t = getT();
	let revealed = $state(false);
	const errorId = $derived(`${id}-error`);
	const isPassword = $derived(type === 'password');
	const resolvedType = $derived(isPassword && revealed ? 'text' : type);
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class="text-sm font-medium text-title">
		{label}
		{#if required}<span class="text-danger" aria-hidden="true">*</span>{/if}
	</label>
	<div class="relative">
		<input
			{id}
			{name}
			type={resolvedType}
			bind:value
			{required}
			{disabled}
			autocomplete={autocomplete as HTMLInputElement['autocomplete']}
			{placeholder}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? errorId : undefined}
			class="w-full rounded-[var(--radius-control)] border bg-surface px-3.5 py-2.5 text-sm text-text transition
				placeholder:text-muted/70 disabled:cursor-not-allowed disabled:bg-background disabled:text-muted
				{error ? 'border-danger' : 'border-border'}
				{isPassword ? 'pr-11' : ''}"
		/>
		{#if isPassword}
			<button
				type="button"
				class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition hover:text-text"
				onclick={() => (revealed = !revealed)}
				aria-label={revealed ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
			>
				{#if revealed}
					<EyeOff size={18} aria-hidden="true" />
				{:else}
					<Eye size={18} aria-hidden="true" />
				{/if}
			</button>
		{/if}
	</div>
	{#if error}
		<p id={errorId} class="text-sm text-danger">{error}</p>
	{/if}
</div>
