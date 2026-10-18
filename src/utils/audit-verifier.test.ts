import {verifyAuditEvent, verifyAuditChain,
  type AuditEventToVerify} from "./audit-verifier";
import { sha256 } from "./hashing";
import { LocalAuditProvider } from "../providers/audit/LocalAuditProvider";

describe("verifyAuditEvent", () => {
  async function createTestEvent(): Promise<AuditEventToVerify> {
    const provider = new LocalAuditProvider();

    const generated = await provider.createAuditEvent({
      applicationId: 4,
      eventType: "ai.assessment.completed",
      provider: "mock",
      model: "mock",
      modelVersion: "1",
      inputData: {
        fullName: "Test Test",
        email: "test@test.com",
      },
      decision: "approved",
      riskLevel: "low",
      reasons: [
        "No significant risk indicators detected.",
      ],
    });

    return {
      applicationId: 4,
      eventType: "ai.assessment.completed",
      provider: "mock",
      model: "mock",
      modelVersion: "1",
      inputHash: generated.inputHash,
      outputHash: generated.outputHash,
      previousEventHash: null,
      decision: "approved",
      riskLevel: "low",
      reasons: [
        "No significant risk indicators detected.",
      ],
      eventHash: generated.eventHash,
    };
  }

  test("accepts an untampered event", async () => {
    const event = await createTestEvent();

    expect(
      verifyAuditEvent(event)
    ).toBe(true);
  });

  test("detects a modified decision", async () => {
    const event = await createTestEvent();

    expect(
      verifyAuditEvent({
        ...event,
        decision: "rejected",
      })
    ).toBe(false);
  });

  test("detects a modified output hash", async () => {
    const event = await createTestEvent();

    expect(
      verifyAuditEvent({
        ...event,
        outputHash: "tampered",
      })
    ).toBe(false);
  });

  test("detects a modified previous event hash", async () => {
    const event = await createTestEvent();

    expect(
      verifyAuditEvent({
        ...event,
        previousEventHash: "tampered",
      })
    ).toBe(false);
  });

  test("detects a modified event type", async () => {
    const event = await createTestEvent();

    expect(
      verifyAuditEvent({
        ...event,
        eventType: "human.review.completed",
      })
    ).toBe(false);
  });

  test("detects a broken previous event hash", () => {
    const firstEvent: AuditEventToVerify = {
      applicationId: 4,
      eventType: "ai.assessment.completed",
      provider: "mock",
      model: "mock",
      modelVersion: "1",
      inputHash: "input-1",
      outputHash: "",
      previousEventHash: null,
      decision: "approved",
      riskLevel: "low",
      reasons: ["reason 1"],
      eventHash: "",
    };

    firstEvent.outputHash = sha256({
      decision: firstEvent.decision,
      riskLevel: firstEvent.riskLevel,
      reasons: firstEvent.reasons,
    });

    firstEvent.eventHash = sha256({
      applicationId: firstEvent.applicationId,
      eventType: firstEvent.eventType,
      provider: firstEvent.provider,
      model: firstEvent.model,
      modelVersion: firstEvent.modelVersion,
      inputHash: firstEvent.inputHash,
      outputHash: firstEvent.outputHash,
      previousEventHash: null,
    });

    const secondEvent: AuditEventToVerify = {
      ...firstEvent,
      inputHash: "input-2",
      outputHash: "",
      previousEventHash: "tampered",
      eventHash: "",
    };

    secondEvent.outputHash = sha256({
      decision: secondEvent.decision,
      riskLevel: secondEvent.riskLevel,
      reasons: secondEvent.reasons,
    });

    secondEvent.eventHash = sha256({
      applicationId: secondEvent.applicationId,
      eventType: secondEvent.eventType,
      provider: secondEvent.provider,
      model: secondEvent.model,
      modelVersion: secondEvent.modelVersion,
      inputHash: secondEvent.inputHash,
      outputHash: secondEvent.outputHash,
      previousEventHash: secondEvent.previousEventHash,
    });

    expect(
      verifyAuditChain([
        firstEvent,
        secondEvent,
      ])
    ).toBe(false);
  });

  test("accepts a valid audit chain", () => {
    const firstEvent: AuditEventToVerify = {
      applicationId: 4,
      eventType: "ai.assessment.completed",
      provider: "mock",
      model: "mock",
      modelVersion: "1",
      inputHash: "input-1",
      outputHash: "",
      previousEventHash: null,
      decision: "approved",
      riskLevel: "low",
      reasons: ["reason 1"],
      eventHash: "",
    };

    firstEvent.outputHash = sha256({
      decision: firstEvent.decision,
      riskLevel: firstEvent.riskLevel,
      reasons: firstEvent.reasons,
    });

    firstEvent.eventHash = sha256({
      applicationId: firstEvent.applicationId,
      eventType: firstEvent.eventType,
      provider: firstEvent.provider,
      model: firstEvent.model,
      modelVersion: firstEvent.modelVersion,
      inputHash: firstEvent.inputHash,
      outputHash: firstEvent.outputHash,
      previousEventHash: null,
    });

    const secondEvent: AuditEventToVerify = {
      applicationId: 4,
      eventType: "ai.assessment.completed",
      provider: "mock",
      model: "mock",
      modelVersion: "1",
      inputHash: "input-2",
      outputHash: "",
      previousEventHash: firstEvent.eventHash,
      decision: "approved",
      riskLevel: "low",
      reasons: ["reason 2"],
      eventHash: "",
    };

    secondEvent.outputHash = sha256({
      decision: secondEvent.decision,
      riskLevel: secondEvent.riskLevel,
      reasons: secondEvent.reasons,
    });

    secondEvent.eventHash = sha256({
      applicationId: secondEvent.applicationId,
      eventType: secondEvent.eventType,
      provider: secondEvent.provider,
      model: secondEvent.model,
      modelVersion: secondEvent.modelVersion,
      inputHash: secondEvent.inputHash,
      outputHash: secondEvent.outputHash,
      previousEventHash: secondEvent.previousEventHash,
    });

    expect(
      verifyAuditChain([
        firstEvent,
        secondEvent,
      ])
    ).toBe(true);
  });

  test("detects a tampered event in the chain", () => {
    const firstEvent: AuditEventToVerify = {
      applicationId: 4,
      eventType: "ai.assessment.completed",
      provider: "mock",
      model: "mock",
      modelVersion: "1",
      inputHash: "input-1",
      outputHash: "",
      previousEventHash: null,
      decision: "approved",
      riskLevel: "low",
      reasons: ["reason 1"],
      eventHash: "",
    };

    firstEvent.outputHash = sha256({
      decision: firstEvent.decision,
      riskLevel: firstEvent.riskLevel,
      reasons: firstEvent.reasons,
    });

    firstEvent.eventHash = sha256({
      applicationId: firstEvent.applicationId,
      eventType: firstEvent.eventType,
      provider: firstEvent.provider,
      model: firstEvent.model,
      modelVersion: firstEvent.modelVersion,
      inputHash: firstEvent.inputHash,
      outputHash: firstEvent.outputHash,
      previousEventHash: null,
    });

    const secondEvent: AuditEventToVerify = {
      applicationId: 4,
      eventType: "ai.assessment.completed",
      provider: "mock",
      model: "mock",
      modelVersion: "1",
      inputHash: "input-2",
      outputHash: "",
      previousEventHash: firstEvent.eventHash,
      decision: "approved",
      riskLevel: "low",
      reasons: ["reason 2"],
      eventHash: "",
    };

    secondEvent.outputHash = sha256({
      decision: secondEvent.decision,
      riskLevel: secondEvent.riskLevel,
      reasons: secondEvent.reasons,
    });

    secondEvent.eventHash = sha256({
      applicationId: secondEvent.applicationId,
      eventType: secondEvent.eventType,
      provider: secondEvent.provider,
      model: secondEvent.model,
      modelVersion: secondEvent.modelVersion,
      inputHash: secondEvent.inputHash,
      outputHash: secondEvent.outputHash,
      previousEventHash: secondEvent.previousEventHash,
    });

    const tamperedSecondEvent = {
      ...secondEvent,
      decision: "rejected" as const,
    };

    expect(
      verifyAuditChain([
        firstEvent,
        tamperedSecondEvent,
      ])
    ).toBe(false);
  });

  test("accepts a genesis event with an omitted previous hash", async () => {
    const event = await createTestEvent();

    const eventWithoutPreviousHash: AuditEventToVerify = {
      ...event,
    };

    delete eventWithoutPreviousHash.previousEventHash;

    expect(
      verifyAuditEvent(eventWithoutPreviousHash)
    ).toBe(true);

    expect(
      verifyAuditChain([eventWithoutPreviousHash])
    ).toBe(true);
  });

});
