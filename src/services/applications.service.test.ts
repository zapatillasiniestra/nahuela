import pool from "../db/db";
import applicationsService from "./applications.service";
import { verifyAuditEvent } from "../utils/audit-verifier";
import { MockComplianceProvider } from "../providers/compliance/MockComplianceProvider";

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

    expect(result.rows).toHaveLength(5);

    const humanCompleted = result.rows[4];

expect(humanCompleted.event_type)
  .toBe("human.review.completed");

expect(humanCompleted.decision)
  .toBe("approved");

expect(humanCompleted.previous_event_hash)
  .toBe(result.rows[3].event_hash);

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

    expect(report.status).toBe("under_review");
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