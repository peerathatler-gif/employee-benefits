/**
 * Append-only audit logging. NEVER pass secrets (passwords, raw session or
 * reset tokens, etc) into `metadata` — this table is expected to be
 * readable by DEVELOPER/ADMIN diagnostics tooling in a later phase.
 */
import { db } from './db';

export interface AuditLogInput {
	actorUserId?: string | null;
	action: string;
	entityType: string;
	entityId?: string | null;
	metadata?: Record<string, unknown>;
	requestId?: string | null;
}

export async function recordAuditLog(input: AuditLogInput): Promise<void> {
	try {
		await db.auditLog.create({
			data: {
				actorUserId: input.actorUserId ?? null,
				action: input.action,
				entityType: input.entityType,
				entityId: input.entityId ?? null,
				metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
				requestId: input.requestId ?? null
			}
		});
	} catch (err) {
		// Audit logging must never take down the request it is describing.
		console.error('[audit] failed to record audit log entry', input.action, err);
	}
}
