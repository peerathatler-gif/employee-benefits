<script lang="ts">
	/**
	 * Shared card/table shell for every admin list page (employees,
	 * departments, positions, leave types, users, audit log, benefit
	 * catalog, ...). Gives every one of them the same surface/border/
	 * shadow/radius treatment, zebra-free but clearly separated rows, a
	 * hover affordance, and one consistent empty state — instead of each
	 * page hand-rolling its own bare `<table>`.
	 *
	 * Responsive behavior: below the `sm` breakpoint, rows collapse into
	 * stacked "cards" via the global `.responsive-table` rule in
	 * `src/routes/layout.css` — each `<td>` must carry a `data-label`
	 * attribute (its column header) for that rule to show a label next to
	 * the value once the real `<thead>` is hidden. Caller is responsible
	 * for the `<tr>`/`<td>` markup (so it can show whatever controls it
	 * needs per row); this component only owns the headers + the wrapper.
	 */
	import type { Snippet } from 'svelte';

	interface Props {
		headers: string[];
		isEmpty: boolean;
		emptyLabel: string;
		body: Snippet;
	}

	const { headers, isEmpty, emptyLabel, body }: Props = $props();
</script>

<div class="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-sm">
	<div class="overflow-x-auto">
		<table class="responsive-table w-full text-left text-sm">
			<thead class="bg-background/70 text-xs font-semibold tracking-wide text-muted uppercase">
				<tr>
					{#each headers as h (h)}
						<th class="px-4 py-3">{h}</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#if isEmpty}
					<tr>
						<td colspan={headers.length} class="px-4 py-10 text-center text-sm text-muted"
							>{emptyLabel}</td
						>
					</tr>
				{:else}
					{@render body()}
				{/if}
			</tbody>
		</table>
	</div>
</div>
