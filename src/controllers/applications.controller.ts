import { Request, Response, NextFunction } from "express";
import applicationsService from "../services/applications.service";
import {AppError} from "../utils/AppError";
import { createApplicationSchema, updateStatusSchema } from "../validators/applications.validator";
import { ApplicationStatus } from "../types/application";
import auditService from "../services/audit.service";
import complianceService from "../services/compliance.service";
import identityService from "../services/identity.service";
import pool from "../db/db";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: number;
      email: string;
      role: "user" | "admin";
    };
  }
}

/**
 * @swagger
 * /applications:
 *   get:
 *     summary: Get paginated applications
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of applications
 */


async function getApplications(
    req: Request,
    res: Response
  ) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const status =
  typeof req.query.status === "string"
    ? (req.query.status as ApplicationStatus)
    : undefined;
  const search =
    typeof req.query.search === "string"
      ? req.query.search
      : undefined;
  const order =
    req.query.order === "asc" || req.query.order === "desc"
      ? req.query.order
      : undefined;

  if (!req.user) {
      throw new AppError("Unauthorized", 401);
  }
  const applications = await applicationsService.getApplications(
    req.user.userId,
    page,
    limit,
    status,
    search,
    order
  );
  res.json(applications);
}

async function getAllApplications(
    req: Request,
    res: Response
  ) {

  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const applications = await applicationsService.getAllApplications();
  res.json(applications);
}

async function getApplicationsById(
  req: Request,
  res: Response
) {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const applicationId = Number(req.params.id);

  if (Number.isNaN(applicationId)) {
    throw new AppError(
      "invalid application id",
      400
    );
  }

  const application =
    await applicationsService.getApplicationsById(
      applicationId,
      req.user.userId,
      req.user.role
    );

  res.json(application);
}

async function getStats(
    req: Request,
    res: Response
  ) {

  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const applications = await applicationsService.getStats(req.user.userId);
  res.json(applications);
}

async function getRecents(
    req: Request,
    res: Response
  ) {

  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const applications = await applicationsService.getRecents();
  res.json(applications);
}

async function createApplication(
    req: Request,
    res: Response
  ) {

  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const data = createApplicationSchema.parse(req.body);
  const { full_name, email } = data;  

  const application = await applicationsService.createApplication(
    req.user.userId,
    full_name,
    email
  );

  res.json(application);
}

async function updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {

  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  try {
    const { id } = req.params;
    const { status } = updateStatusSchema.parse(req.body);

    const application = await applicationsService.updateStatus(
      Number(id),
      req.user.userId,
      status
    );

    return res.json(application);

  } catch (err) {
    return next(err);
  }
}

async function getAudit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const applicationId = Number(req.params.id);

    if (Number.isNaN(applicationId)) {
      throw new AppError(
        "invalid application id",
        400
      );
    }

    await applicationsService.authorizeApplicationAccess(
      applicationId,
      req.user.userId,
      req.user.role
    );

    const client = await pool.connect();

    try {
      const auditEvents =
        await auditService.getAuditEvents(
          client,
          applicationId
        );

      return res.status(200).json(auditEvents);

    } finally {
      client.release();
    }

  } catch (err) {
    return next(err);
  }
}

async function getComplianceChecks(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const applicationId = Number(req.params.id);

    if (Number.isNaN(applicationId)) {
      throw new AppError(
        "invalid application id",
        400
      );
    }

    await applicationsService.authorizeApplicationAccess(
      applicationId,
      req.user.userId,
      req.user.role
    );

    const client = await pool.connect();

    try {
      const complianceChecks =
        await complianceService.getComplianceChecks(
          client,
          applicationId
        );

      return res.status(200).json(complianceChecks);

    } finally {
      client.release();
    }

  } catch (err) {
    return next(err);
  }
}

async function getIdentityChecks(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const applicationId = Number(req.params.id);

    if (Number.isNaN(applicationId)) {
      throw new AppError(
        "invalid application id",
        400
      );
    }

    await applicationsService.authorizeApplicationAccess(
      applicationId,
      req.user.userId,
      req.user.role
    );

    const client = await pool.connect();

    try {
      const identityChecks =
        await identityService.getIdentityChecks(
          client,
          applicationId
        );

      return res.status(200).json(identityChecks);

    } finally {
      client.release();
    }

  } catch (err) {
    return next(err);
  }
}

async function verifyAudit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }
    const applicationId = Number(req.params.id);

    if (Number.isNaN(applicationId)) {
      throw new AppError(
        "invalid application id",
        400
      );
    }

    await applicationsService.authorizeApplicationAccess(
      applicationId,
      req.user.userId,
      req.user.role
    );
    
    const client = await pool.connect();

    try {
      const result =
        await auditService.verifyAuditChain(
          client,
          applicationId
        );

      return res.status(200).json(result);

    } finally {
      client.release();
    }

  } catch (err) {
    return next(err);
  }
}

async function getDecisionHistory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const applicationId = Number(req.params.id);

    if (!Number.isInteger(applicationId)) {
      throw new AppError(
        "invalid application id",
        400
      );
    }

    const result =
      await applicationsService.getDecisionHistory(
        applicationId,
        req.user.userId,
        req.user.role
      );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
    return;
  }
}

async function getOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const applicationId = Number(req.params.id);

    if (!Number.isInteger(applicationId)) {
      throw new AppError(
        "invalid application id",
        400
      );
    }

    const result =
      await applicationsService.getOnboarding(
        applicationId,
        req.user.userId,
        req.user.role
      );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
    return;
  }
}

async function getComplianceReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
      });
      return;
    }

    const applicationId = Number(req.params.id);

    const result =
      await applicationsService.getComplianceReport(
        applicationId,
        req.user.userId,
        req.user.role
      );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getAuditEvents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const applicationId = Number(req.params.id);

    if (!Number.isInteger(applicationId)) {
      throw new AppError(
        "invalid application id",
        400
      );
    }

    const userId = req.user!.userId;

    await applicationsService.authorizeApplicationAccess(
      applicationId,
      userId,
      req.user!.role
    );

    const client = await pool.connect();

    try {
      const events =
        await applicationsService.getAuditEvents(
          client,
          applicationId
        );

      res.status(200).json(events);
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

export default {
  getApplications,
  getAllApplications,
  getApplicationsById,
  getStats,
  getRecents,
  createApplication,
  updateStatus,
  getAudit,
  getComplianceChecks,
  getIdentityChecks,
  verifyAudit,
  getDecisionHistory,
  getOnboarding,
  getComplianceReport,
  getAuditEvents
};

