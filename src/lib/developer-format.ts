/** Small display helpers shared by the developer console pages. */

export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export const SEVERITY_TONE: Record<Severity, 'info' | 'warning' | 'danger'> = {
	INFO: 'info',
	WARNING: 'warning',
	ERROR: 'danger',
	CRITICAL: 'danger'
};

export const SEVERITY_DOT: Record<Severity, string> = {
	INFO: 'bg-sky-500',
	WARNING: 'bg-amber-500',
	ERROR: 'bg-rose-500',
	CRITICAL: 'bg-red-700'
};

export function formatDateTime(value: string, locale: string): string {
	return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(value));
}

/** "3 min ago" style relative time, localized via Intl. */
export function formatRelative(value: string, locale: string, now = Date.now()): string {
	const diffSec = Math.round((new Date(value).getTime() - now) / 1000);
	const rtf = new Intl.RelativeTimeFormat(locale === 'th' ? 'th' : 'en', { numeric: 'auto' });
	const abs = Math.abs(diffSec);
	if (abs < 60) return rtf.format(diffSec, 'second');
	if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
	if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
	return rtf.format(Math.round(diffSec / 86400), 'day');
}

export function formatDuration(totalSeconds: number): string {
	const d = Math.floor(totalSeconds / 86400);
	const h = Math.floor((totalSeconds % 86400) / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	if (d > 0) return `${d}d ${h}h ${m}m`;
	if (h > 0) return `${h}h ${m}m`;
	return `${m}m ${totalSeconds % 60}s`;
}

/** Very small UA summary ("Chrome · Windows") — display only. */
export function summarizeUserAgent(ua: string | null): string {
	if (!ua) return '—';
	const browser = /Edg\//.test(ua)
		? 'Edge'
		: /OPR\//.test(ua)
			? 'Opera'
			: /Chrome\//.test(ua)
				? 'Chrome'
				: /Firefox\//.test(ua)
					? 'Firefox'
					: /Safari\//.test(ua)
						? 'Safari'
						: /curl\//.test(ua)
							? 'curl'
							: 'Other';
	const os = /Windows/.test(ua)
		? 'Windows'
		: /Android/.test(ua)
			? 'Android'
			: /iPhone|iPad/.test(ua)
				? 'iOS'
				: /Mac OS X/.test(ua)
					? 'macOS'
					: /Linux/.test(ua)
						? 'Linux'
						: '';
	return os ? `${browser} · ${os}` : browser;
}
