<script lang="ts">
	/**
	 * Reusable status pill. `tone` maps to this app's existing white/blue
	 * design tokens (`--color-success`/`warning`/`danger`/`muted` in
	 * `src/routes/layout.css`) so every admin list page renders status the
	 * same way instead of each page hand-rolling its own badge classes.
	 */
	type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

	interface Props {
		label: string;
		tone?: Tone;
	}

	const { label, tone = 'neutral' }: Props = $props();

	const toneClass: Record<Tone, string> = {
		success: 'bg-success/10 text-success',
		warning: 'bg-warning/10 text-warning',
		danger: 'bg-danger/10 text-danger',
		info: 'bg-brand-soft text-brand-hover',
		neutral: 'bg-background text-muted'
	};
</script>

<span
	class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap {toneClass[
		tone
	]}"
>
	{label}
</span>
