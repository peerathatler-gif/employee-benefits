<script lang="ts">
	/**
	 * Small circular avatar used in admin list/detail screens. Falls back to
	 * the person's initials (on the brand-soft token) whenever there is no
	 * photo, or the photo fails to load (404, e.g. not uploaded yet).
	 */
	interface Props {
		name: string;
		src?: string | null;
		size?: number;
	}

	const { name, src = null, size = 36 }: Props = $props();

	let loadFailed = $state(false);

	const initials = $derived(
		name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('') || '?'
	);

	const showImage = $derived(Boolean(src) && !loadFailed);
</script>

{#if showImage}
	<img
		src={src ?? ''}
		alt=""
		width={size}
		height={size}
		class="shrink-0 rounded-full border border-border object-cover"
		style="width: {size}px; height: {size}px;"
		onerror={() => (loadFailed = true)}
	/>
{:else}
	<span
		class="flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-hover"
		style="width: {size}px; height: {size}px;"
		aria-hidden="true"
	>
		{initials}
	</span>
{/if}
