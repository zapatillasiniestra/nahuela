import type { PoolClient } from "pg";
import { createAIProvider } from "../providers/ProviderFactory";
import aiAssessmentRepository from "../repositories/ai-assessment.repository";
import auditService from "./audit.service";
import type { AIAssessmentInput } from "../providers/ai/AIAssessment";

export async function assessApplication(
  client: PoolClient,
  applicationId: number,
  input: AIAssessmentInput
) {
  const aiProvider = await createAIProvider();

  const assessment =
    await aiProvider.assessApplication(input);

  await aiAssessmentRepository.create(
    client,
    {
      applicationId,
      riskLevel: assessment.riskLevel,
      decision: assessment.decision,
      reasons: assessment.reasons,
      model: "mock"
    }
  );

  await auditService.createAuditEvent(
    client,
    {
      applicationId,
      eventType: "ai.assessment.completed",
      provider: "mock",
      model: "mock",
      modelVersion: "1",
      inputData: {...input},
      decision: assessment.decision,
      riskLevel: assessment.riskLevel,
      reasons: assessment.reasons
    }
  );

  return assessment;
}