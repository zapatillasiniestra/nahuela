import pool from "../db/db";
import applicationsService from "./applications.service";
import { verifyAuditEvent } from "../utils/audit-verifier";
import { MockComplianceProvider } from "../providers/compliance/MockComplianceProvider";
import auditService from "./audit.service";

describe("createApplication compliance and audit flow", () => {
  test("creates compliance and AI audit events in one chain", async () => {
    const application =
      await applicationsService.createApplication(
        4,
        "Compliance Test User",
        `test-${Date.now()}@example.com`
      );

    const result = await pool.query(
      `
      SELECT
        event_type,
        application_id,
        provider,
        model,
        model_version,
        input_hash,
        output_hash,
        previous_event_hash,
        decision,
        risk_level,
        reasons,
        event_hash
      FROM audit_events
      WHERE application_id = $1
      ORDER BY id ASC
      `,
      [application.id]
    );

    expect(result.rows).toHaveLength(4);

    const identity = result.rows[0];
    const started = result.rows[1];
    const completed = result.rows[2];
    const ai = result.rows[3];

    expect(identity.event_type)
      .toBe("identity.verification.completed");

    expect(started.event_type)
      .toBe("compliance.check.started");

    expect(completed.event_type)
      .toBe("compliance.check.completed");

    expect(ai.event_type)
      .toBe("ai.assessment.completed");

    expect(identity.previous_event_hash)
      .toBeNull();

    expect(started.previous_event_hash)
      .toBe(identity.event_hash);

    expect(completed.previous_event_hash)
      .toBe(started.event_hash);

    expect(ai.previous_event_hash)
      .toBe(completed.event_hash);
      
    const tamperedEvent = {
      applicationId: completed.application_id,
      eventType: completed.event_type,
      provider: completed.provider,
      model: completed.model ?? undefined,
      modelVersion: completed.model_version ?? undefined,
      inputHash: completed.input_hash,
      outputHash: completed.output_hash,
      previousEventHash:
        completed.previous_event_hash ?? undefined,
      decision: "tampered",
      riskLevel: completed.risk_level ?? undefined,
      reasons: completed.reasons,
      eventHash: completed.event_hash,
    };

    expect(
      verifyAuditEvent(tamperedEvent)
    ).toBe(false);

    await pool.query(
      "DELETE FROM applications WHERE id = $1",
      [application.id]
    );
  });

  test("rolls back application when compliance provider fails", async () => {
    process.env.COMPLIANCE_PROVIDER = "mock";

    const originalCheck =
      MockComplianceProvider.prototype.check;

    MockComplianceProvider.prototype.check = jest
      .fn()
      .mockRejectedValue(
        new Error("Compliance provider unavailable")
      );

    try {
      await expect(
        applicationsService.createApplication(
          4,
          "Failure Test User",
          "failure-test@example.com"
        )
      ).rejects.toThrow(
        "Compliance provider unavailable"
      );

      const result = await pool.query(
        `
        SELECT id
        FROM applications
        WHERE email = $1
        `,
        ["failure-test@example.com"]
      );

      expect(result.rows).toHaveLength(0);
    } finally {
      MockComplianceProvider.prototype.check =
        originalCheck;
    }
  });

  test("creates chained human review audit events", async () => {
  const application =
    await applicationsService.createApplication(
      4,
      "Human Review Test User",
      `review-${Date.now()}@example.com`
    );

  try {

await applicationsService.updateStatus(
  application.id,
  4,
  "under_review"
);

await applicationsService.updateStatus(
  application.id,
  4,
  "approved"
);

    const result = await pool.query(
      `
      SELECT
        event_type,
        application_id,
        previous_event_hash,
        event_hash,
        decision
      FROM audit_events
      WHERE application_id = $1
      ORDER BY id ASC
      `,
      [application.id]
    );

expect(result.rows).toHaveLength(6);

const humanStarted = result.rows[4];
const humanCompleted = result.rows[5];

expect(humanStarted.event_type)
  .toBe("human.review.started");

expect(humanStarted.decision)
  .toBe("under_review");

expect(humanCompleted.event_type)
  .toBe("human.review.completed");

expect(humanCompleted.decision)
  .toBe("approved");

expect(humanStarted.previous_event_hash)
  .toBe(result.rows[3].event_hash);

expect(humanCompleted.previous_event_hash)
  .toBe(humanStarted.event_hash);

} finally {
    await pool.query(
      "DELETE FROM applications WHERE id = $1",
      [application.id]
    );
  }
});

test("keeps audit chain valid after human review", async () => {
  const application =
    await applicationsService.createApplication(
      4,
      "Audit Chain Test",
      `audit-${Date.now()}@example.com`
    );

  try {
    await applicationsService.updateStatus(
      application.id,
      4,
      "under_review"
    );

    await applicationsService.updateStatus(
      application.id,
      4,
      "approved"
    );

const client = await pool.connect();

try {
  const verification =
    await auditService.verifyAuditChain(
      client,
      application.id
    );

  expect(verification.valid).toBe(true);
  expect(verification.events).toBe(6);
} finally {
  client.release();
}
  } finally {
    await pool.query(
      "DELETE FROM applications WHERE id = $1",
      [application.id]
    );
  }
});

test("detects tampering with a human review audit event", async () => {
  const application =
    await applicationsService.createApplication(
      4,
      "Tamper Test",
      `tamper-${Date.now()}@example.com`
    );

  try {
    await applicationsService.updateStatus(
      application.id,
      4,
      "under_review"
    );

    await applicationsService.updateStatus(
      application.id,
      4,
      "approved"
    );

    const result = await pool.query(
      `
      SELECT *
      FROM audit_events
      WHERE application_id = $1
      ORDER BY id ASC
      `,
      [application.id]
    );

    const humanReview = result.rows.at(-1);

    expect(humanReview.event_type)
      .toBe("human.review.completed");

    const tamperedEvent = {
      applicationId: humanReview.application_id,
      eventType: humanReview.event_type,
      provider: humanReview.provider,
      model: humanReview.model ?? undefined,
      modelVersion:
        humanReview.model_version ?? undefined,
      inputHash: humanReview.input_hash,
      outputHash: humanReview.output_hash,
      previousEventHash:
        humanReview.previous_event_hash ?? undefined,
      decision: "rejected",
      riskLevel:
        humanReview.risk_level ?? undefined,
      reasons: humanReview.reasons,
      eventHash: humanReview.event_hash,
    };

    expect(
      verifyAuditEvent(tamperedEvent)
    ).toBe(false);
  } finally {
    await pool.query(
      "DELETE FROM applications WHERE id = $1",
      [application.id]
    );
  }
});

test("compliance report uses application workflow status", async () => {
  const application =
    await applicationsService.createApplication(
      4,
      "Report Status Test",
      `report-${Date.now()}@example.com`
    );

  try {
    const report =
      await applicationsService.getComplianceReport(
        application.id,
        4,
        "user"
      );

expect(report.status).toBe("pending");

} finally {
    await pool.query(
      "DELETE FROM applications WHERE id = $1",
      [application.id]
    );
  }
});

  afterAll(async () => {
    await pool.end();
  });
});