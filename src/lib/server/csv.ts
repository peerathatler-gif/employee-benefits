/**
 * Minimal CSV builder for admin report exports.
 *
 * SECURITY: any cell whose text starts with `=`, `+`, `-` or `@` is a
 * formula-injection vector in Excel/Sheets/LibreOffice (e.g. a benefit
 * description of `=cmd|'/c calc'!A1` executed on open). Every such cell is
 * prefixed with a leading `'` (a value that itself starts with one of those
 * characters, quote or no quote, still gets the prefix) before quoting —
 * this is a hard requirement, not a style choice. Do not bypass this helper
 * to build a CSV cell by hand.
 */
const FORMULA_TRIGGER_CHARS = ['=', '+', '-', '@'];

/** Neutralizes a single cell value against spreadsheet formula injection. */
export function escapeCsvCell(value: unknown): string {
	let text = value === null || value === undefined ? '' : String(value);

	if (text.length > 0 && FORMULA_TRIGGER_CHARS.includes(text[0])) {
		text = `'${text}`;
	}

	// Always double-quote and escape embedded quotes — simplest way to make
	// commas/newlines/quotes in the original value safe too.
	return `"${text.replace(/"/g, '""')}"`;
}

export function toCsvRow(cells: unknown[]): string {
	return cells.map(escapeCsvCell).join(',');
}

/** Builds a full CSV document (header + rows), CRLF line endings, with a UTF-8 BOM for Excel. */
export function buildCsv(header: string[], rows: unknown[][]): string {
	const lines = [toCsvRow(header), ...rows.map((row) => toCsvRow(row))];
	return '﻿' + lines.join('\r\n') + '\r\n';
}
