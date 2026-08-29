import type { PoolClient } from "pg";
import auditEventsRepository from "../repositories/audit-events.repository";
import { createAuditProvider } from "../providers/audit/AuditProviderFactory";
import {
  verifyAuditChain as verifyAuditChainUtil,
  type AuditEventToVerify
} from "../utils/audit-verifier";
import { AuditEventType } from "../types/audit";

interface CreateAuditData {
  applicationId: number;
  eventType: AuditEventType;
  provider: string;
  model?: string;
  modelVersion?: string;
  inputData: Record<string, unknown>;
  decision: string;
  riskLevel?: string;
  reasons: string[];
}

async function getAuditTimeline(
  client: PoolClient,
  applicationId: number
) {
  return auditEventsRepository.findTimelineByApplicationId(
    client,
    applicationId
  );
}

async function createAuditEvent(
  client: PoolClient,
  data: CreateAuditData
) {
  const previousEventHash =
    await auditEventsRepository.findLatestHash(
      client,
      data.applicationId
    );

  const auditProvider = createAuditProvider();

  const auditEvent =
    await auditProvider.createAuditEvent({
      ...data,
      previousEventHash
    });

  return auditEventsRepository.create(
    client,
    {
      ...data,
      inputHash: auditEvent.inputHash,
      outputHash: auditEvent.outputHash,
      previousEventHash:
        auditEvent.previousEventHash,
      eventHash: auditEvent.eventHash,
      hashAlgorithm:
        auditEvent.hashAlgorithm
    }
  );
}

async function getAuditEvents(
  client: PoolClient,
  applicationId: number
) {
  return auditEventsRepository.findByApplicationId(
    client,
    applicationId
  );
}

async function verifyAuditChain(
  client: PoolClient,
  applicationId: number
) {
  const rows =
    await auditEventsRepository.findByApplicationId(
      client,
      applicationId
    );

  const events: AuditEventToVerify[] = rows.map(
    (row) => ({
      applicationId: row.application_id,
      eventType: row.event_type,
      provider: row.provider,
      model: row.model,
      modelVersion: row.model_version,
      inputHash: row.input_hash,
      outputHash: row.output_hash,
      previousEventHash:
        row.previous_event_hash,
      decision: row.decision,
      riskLevel: row.risk_level,
      reasons: row.reasons,
      eventHash: row.event_hash
    })
  );

  return {
    valid: verifyAuditChainUtil(events),
    events: events.length
  };
}

export default {
  getAuditTimeline,
  createAuditEvent,
  getAuditEvents,
  verifyAuditChain
};