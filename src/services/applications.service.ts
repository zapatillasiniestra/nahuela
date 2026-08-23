import pool from "../db/db";
import type { PoolClient } from "pg";
import type {
  ApplicationStats,
  ApplicationStatus,
  IdentityRequest,
  SortOrder,
} from "../types/application";
import repository from "../repositories/applications.repository";
import auditRepository from "../repositories/audit.repository";
import { addEmailJob } from "../jobs/email.queue";
import { AppError } from "../utils/AppError";
import {
  createIdentityProvider,
  createAIProvider,
} from "../providers/ProviderFactory";
import aiAssessmentRepository
  from "../repositories/ai-assessment.repository";
import auditService from "./audit.service";
import { createComplianceProvider }
  from "../providers/compliance/ComplianceProviderFactory";
import complianceRepository
  from "../repositories/compliance.repository";
import identityVerificationsRepository
  from "../repositories/identity-verifications.repository";
import documentsRepository from "../repositories/documents.repository";

async function getComplianceReport(
  applicationId: number,
  userId: number,
  role: "user" | "admin"
) {
  await authorizeApplicationAccess(
    applicationId,
    userId,
    role
  );

  const client = await pool.connect();

  try {
    const [
      identity,
      documents,
      compliance,
      aiAssessments,
      auditEvents,
      auditVerification,
    ] = await Promise.all([
      identityVerificationsRepository.findByApplicationId(
        client,
        applicationId
      ),

      documentsRepository.findByApplicationId(
        client,
        applicationId
      ),

      complianceRepository.findByApplicationId(
        client,
        applicationId
      ),

      aiAssessmentRepository.findByApplicationId(
        client,
        applicationId
      ),

      auditService.getAuditEvents(
        client,
        applicationId
      ),

      auditService.verifyAuditChain(
        client,
        applicationId
      ),
    ]);

    const latestIdentity = identity.at(-1) ?? null;
    const latestDocument = documents.at(-1) ?? null;
    const latestCompliance = compliance.at(-1) ?? null;
    const latestAiAssessment =
      aiAssessments.at(-1) ?? null;

    const approved =
      latestIdentity?.verified === true &&
      latestDocument?.status === "verified" &&
      latestCompliance?.decision === "clear" &&
      latestAiAssessment?.decision === "approved" &&
      auditVerification.valid === true;

    return {
      applicationId,

      status: approved
        ? "approved"
        : "pending",

      identity: latestIdentity
        ? {
            verified: latestIdentity.verified,
            provider: latestIdentity.provider,
            decision: latestIdentity.decision,
          }
        : null,

      document: latestDocument
        ? {
            type: latestDocument.documentType,
            status: latestDocument.status,
            provider: latestDocument.provider,
            fileName: latestDocument.fileName,
          }
        : null,

      compliance: latestCompliance
        ? {
            decision: latestCompliance.decision,
            provider: latestCompliance.provider,
            reasons: latestCompliance.reasons,
          }
        : null,

      aiAssessment: latestAiAssessment
        ? {
            decision: latestAiAssessment.decision,
            riskLevel: latestAiAssessment.riskLevel,
            reasons: latestAiAssessment.reasons,
            model: latestAiAssessment.model,
          }
        : null,

      audit: {
        valid: auditVerification.valid,
        events: auditVerification.events,
        timeline: auditEvents,
      },
    };
  } finally {
    client.release();
  }
}

async function getOnboarding(
  applicationId: number,
  userId: number,
  role: "user" | "admin"
) {
  await authorizeApplicationAccess(
    applicationId,
    userId,
    role
  );

  const history = await getDecisionHistory(
    applicationId,
    userId,
    role
  );

  return {
    applicationId,
    status:
      history.aiAssessments[0]?.decision ?? "pending",

    identity: {
      verified:
        history.identity[0]?.verified ?? false,
      provider:
        history.identity[0]?.provider ?? null,
    },

    compliance: {
      decision:
        history.compliance[0]?.decision ?? null,
      provider:
        history.compliance[0]?.provider ?? null,
    },

    aiAssessment: {
      decision:
        history.aiAssessments[0]?.decision ?? null,
      riskLevel:
        history.aiAssessments[0]?.riskLevel ?? null,
    },

    audit: history.auditVerification,
  };
}

async function getDecisionHistory(
  applicationId: number,
  userId: number,
  role: "user" | "admin"
) {
  await authorizeApplicationAccess(
    applicationId,
    userId,
    role
  );

  const client = await pool.connect();

  try {
  const [
      identity,
      documents,
      compliance,
      aiAssessments,
      auditEvents,
      auditVerification,
    ] = await Promise.all([
      identityVerificationsRepository.findByApplicationId(
        client,
        applicationId
      ),

      documentsRepository.findByApplicationId(
        client,
        applicationId
      ),

      complianceRepository.findByApplicationId(
        client,
        applicationId
      ),

      aiAssessmentRepository.findByApplicationId(
        client,
        applicationId
      ),

      auditService.getAuditEvents(
        client,
        applicationId
      ),

      auditService.verifyAuditChain(
        client,
        applicationId
      ),
    ]);
    return {
      applicationId,
      identity,
      documents,
      compliance,
      aiAssessments,
      auditEvents,
      auditVerification,
    };
  } finally {
    client.release();
  }
}

async function createIdentityVerificationAudit(
  client: PoolClient,
  applicationId: number,
  fullName: string,
  email: string,
  verification: Awaited<
    ReturnType<typeof verifyIdentity>
  >
) {
  await auditService.createAuditEvent(client, {
    applicationId,
    eventType: "identity.verification.completed",
    provider: verification.provider,
    model: "none",
    inputData: {
      fullName,
      email,
    },
    decision: verification.decision ?? "rejected",
    riskLevel: "not_applicable",
    reasons: verification.reasons,
  });
}
async function verifyIdentity(
  request: IdentityRequest
) {
  return createIdentityProvider().verifyIdentity(request);
}

async function runAIAssessment(
  fullName: string,
  email: string,
  verification: Awaited<ReturnType<typeof verifyIdentity>>
) {
  const aiProvider = createAIProvider();

  return aiProvider.assessApplication({
    fullName,
    email,
    verification,
  });
}

async function createComplianceAuditStarted(
  client: PoolClient,
  applicationId: number,
  fullName: string,
  email: string
) {
  await auditService.createAuditEvent(client, {
    applicationId,
    eventType: "compliance.check.started",
    provider: process.env.COMPLIANCE_PROVIDER ?? "unknown",
    model: "none",
    inputData: {
      fullName,
      email,
    },
    decision: "pending",
    riskLevel: "not_applicable",
    reasons: [],
  });
}

async function runComplianceCheck(
  client: PoolClient,
  applicationId: number,
  fullName: string,
  email: string
) {
  const complianceProvider = createComplianceProvider();

  const compliance = await complianceProvider.check({
    applicationId,
    fullName,
    email,
  });

  await complianceRepository.create(client, {
    applicationId,
    provider: compliance.provider,
    decision: compliance.decision,
    reasons: compliance.reasons,
    externalId: compliance.externalId,
    raw: compliance.raw,
  });

  await auditService.createAuditEvent(client, {
    applicationId,
    eventType: "compliance.check.completed",
    provider: compliance.provider,
    model: "none",
    inputData: {
      fullName,
      email,
    },
    decision: compliance.decision,
    riskLevel: "not_applicable",
    reasons: compliance.reasons,
  });

  return compliance;
}

async function createAIAssessmentAudit(
  client: PoolClient,
  applicationId: number,
  fullName: string,
  email: string,
  verification: Awaited<ReturnType<typeof verifyIdentity>>,
  assessment: Awaited<
    ReturnType<
      ReturnType<typeof createAIProvider>["assessApplication"]
    >
  >
) {
  await aiAssessmentRepository.create(client, {
    applicationId,
    riskLevel: assessment.riskLevel,
    decision: assessment.decision,
    reasons: assessment.reasons,
    model: "mock",
  });

  await auditService.createAuditEvent(client, {
    applicationId,
    eventType: "ai.assessment.completed",
    provider: "mock",
    model: "mock",
    modelVersion: "1",
    inputData: {
      fullName,
      email,
      identityVerification: {
        verified: verification.verified,
        confidence: verification.confidence,
        provider: verification.provider,
        decision: verification.decision,
        reasons: verification.reasons,
      },
    },
    decision: assessment.decision,
    riskLevel: assessment.riskLevel,
    reasons: assessment.reasons,
  });
}

async function getApplications(
  userId: number,
  page: number = 1,
  limit: number = 10,
  status?: ApplicationStatus,
  search?: string,
  order?: SortOrder
) {
  const offset = (page - 1) * limit;

  const result = await repository.getApplications(
    userId,
    limit,
    offset,
    status as ApplicationStatus,
    search as string,
    order as SortOrder
  );

  return {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
    data: result.applications,
  };
}

async function getAllApplications() {
  const applications = await repository.findAll();

  if (!applications) {
    throw new AppError(
      "applications not found",
      404
    );
  }

  return applications;
}

async function getApplicationsById(
  applicationId: number,
  userId: number,
  role: "user" | "admin"
) {
  return authorizeApplicationAccess(
    applicationId,
    userId,
    role
  );
}

async function authorizeApplicationAccess(
  applicationId: number,
  userId: number,
  role: "user" | "admin"
) {
  const application =
    await repository.findById(applicationId);

  if (!application) {
    throw new AppError(
      "application not found",
      404
    );
  }

  if (
    role !== "admin" &&
    application.user_id !== userId
  ) {
    throw new AppError(
      "forbidden",
      403
    );
  }

  return application;
}

async function getStats(userId: number) {
  const application =
    await repository.getStats(userId);

  if (!application) {
    throw new AppError(
      "data not found",
      404
    );
  }

  const stats: ApplicationStats = {
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    approvalRate: 0,
  };

  let approved = 0;
  let rejected = 0;

  for (const row of application) {
    stats[row.status as ApplicationStatus] =
      Number(row.total);

    if (row.status === "approved") {
      approved = Number(row.total);
    }

    if (row.status === "rejected") {
      rejected = Number(row.total);
    }

    if (approved + rejected > 0) {
      stats.approvalRate =
        (approved / (approved + rejected)) * 100;
    } else {
      stats.approvalRate = 0;
    }
  }

  return stats;
}

async function getRecents() {
  const result = await repository.getRecents();

  if (!result) {
    throw new AppError(
      "data not found",
      404
    );
  }

  return result;
}

async function createApplication(
  userId: number,
  full_name: string,
  email: string
) {
  const existing =
    await repository.findActiveByEmail(
      email
    );

  if (existing) {
    throw new AppError(
      "An active application already exists for this email",
      409
    );
  }

  const verification = await verifyIdentity({
    full_name,
    email,
  });


  if (!verification.verified) {
    throw new AppError(
      "identity verification failed",
      400
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const application = await repository.create(
      client,
      {
        userId,
        fullName: full_name,
        email,
        verification,
      }
    );

    await identityVerificationsRepository.create(
      client,
      {
        applicationId: application.id,
        provider: verification.provider,
        verified: verification.verified,
        confidence: verification.confidence,
        decision: verification.decision,
        reasons: verification.reasons,
        externalId: verification.externalId,
        raw: verification.raw,
      }
    );

    await createIdentityVerificationAudit(
      client,
      application.id,
      full_name,
      email,
      verification
    );

    await createComplianceAuditStarted(
      client,
      application.id,
      full_name,
      email
    );

    await runComplianceCheck(
      client,
      application.id,
      full_name,
      email
    );

    const assessment = await runAIAssessment(
      full_name,
      email,
      verification
    );

    await createAIAssessmentAudit(
      client,
      application.id,
      full_name,
      email,
      verification,
      assessment
    );

    await client.query("COMMIT");

    return application;
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function updateStatus(
  applicationId: number,
  adminUserId: number,
  status: ApplicationStatus
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const application =
      await repository.findByIdTx(
        client,
        applicationId
      );

    if (!application) {
      throw new AppError(
        "application not found",
        404
      );
    }

    const currentStatus =
      application.status as ApplicationStatus;

    if (
      currentStatus === "approved" ||
      currentStatus === "rejected"
    ) {
      throw new AppError(
        "application already finalized",
        400
      );
    }

    const allowedTransitions: Record<
      ApplicationStatus,
      ApplicationStatus[]
    > = {
      pending: ["under_review"],
      under_review: ["approved", "rejected"],
      approved: [],
      rejected: [],
    };

    if (
      !allowedTransitions[currentStatus]
        .includes(status)
    ) {
      throw new AppError(
        "invalid status transition",
        400
      );
    }

    if (
      status === "approved" ||
      status === "rejected"
    ) {
      addEmailJob({
        email: application.email,
        fullName: application.full_name,
        status,
      });
    }

    const updated =
      await repository.updateStatus(
        client,
        applicationId,
        status
      );

    await auditRepository.createLog(
      client,
      applicationId,
      adminUserId,
      status
    );

    await client.query("COMMIT");

    return updated;
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default {
  getComplianceReport,
  getOnboarding,
  getDecisionHistory,
  verifyIdentity,
  getApplications,
  getAllApplications,
  getApplicationsById,
  authorizeApplicationAccess,
  getStats,
  getRecents,
  createApplication,
  updateStatus,
};
