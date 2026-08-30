export type AuditEventType =
  | "identity.verification.completed"
  | "compliance.check.started"
  | "compliance.check.completed"
  | "compliance.check.failed"
  | "ai.assessment.completed"
  | "document.verification.completed"
  | "human.review.started"
  | "human.review.completed";