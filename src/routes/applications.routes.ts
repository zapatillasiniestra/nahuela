import { Router } from "express";
import auth from "../middleware/auth.middleware";
import adminOnly from "../middleware/admin.middleware";
import applicationsController from "../controllers/applications.controller";
import documentsController from "../controllers/documents.controller";

const router = Router();

router.get("/", auth, applicationsController.getApplications);
router.get("/stats", auth, applicationsController.getStats);
router.get(
  "/admin",
  auth,
  adminOnly,
  applicationsController.getAllApplications
);
router.get(
  "/admin/recent",
  auth,
  adminOnly,
  applicationsController.getRecents
);

router.get(
  "/:id/ai-audit/verify",
  auth,
  applicationsController.verifyAudit
);

router.get(
  "/:id/ai-audit",
  auth,
  applicationsController.getAudit
);

router.get(
  "/:id/compliance",
  auth,
  applicationsController.getComplianceChecks
);

router.get(
  "/:id/identity",
  auth,
  applicationsController.getIdentityChecks
);

router.get(
  "/:id/decision-history",
  auth,
  applicationsController.getDecisionHistory
);

router.get("/:id", auth, applicationsController.getApplicationsById);

router.get(
  "/:id/onboarding",
  auth,
  applicationsController.getOnboarding
);


router.get(
  "/:id/documents",
  auth,
  documentsController.getDocuments
);

router.get(
  "/:id/report",
  auth,
  applicationsController.getComplianceReport
);

router.get(
  "/:id/audit",
  auth,
  applicationsController.getAuditEvents
);

router.post(
  "/:id/documents",
  auth,
  documentsController.verifyDocument
);

router.post("/", auth, applicationsController.createApplication);

router.patch(
  "/:id/status",
  auth,
  adminOnly,
  applicationsController.updateStatus
);

export default router;
