<script lang="ts">
	/**
	 * Small ghost icon button for table row actions (edit/disable/reset
	 * password/etc). Always carries a visible `title` tooltip AND an
	 * `sr-only` text label — icon-only controls must never be label-only to
	 * a screen reader. `tone="danger"` is for destructive actions
	 * (disable/delete); default is neutral-on-hover-brand.
	 */
	import type { Icon as LucideIcon } from 'lucide-svelte';

	interface Props {
		icon: typeof LucideIcon;
		label: string;
		tone?: 'default' | 'danger' | 'success';
		type?: 'button' | 'submit';
		onclick?: () => void;
	}

	const { icon: Icon, label, tone = 'default', type = 'button', onclick }: Props = $props();

	const toneClass: Record<NonNullable<Props['tone']>, string> = {
		default: 'text-muted hover:border-brand hover:bg-brand-soft hover:text-brand',
		danger: 'text-muted hover:border-danger/40 hover:bg-danger/5 hover:text-danger',
		success: 'text-muted hover:border-success/40 hover:bg-success/5 hover:text-success'
	};
</script>

<button
	{type}
	{onclick}
	title={label}
	class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent transition {toneClass[
		tone
	]}"
>
	<Icon size={16} aria-hidden="true" />
	<span class="sr-only">{label}</span>
</button>
