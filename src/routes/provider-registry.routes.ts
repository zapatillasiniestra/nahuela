import { Router } from "express";
import providerRegistryController from "../controllers/provider-registry.controller";
import authMiddleware from "../middleware/auth.middleware";
import adminMiddleware from "../middleware/admin.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  providerRegistryController.getProviders
);

router.patch(
  "/:type/:name",
  authMiddleware,
  adminMiddleware,
  providerRegistryController.updateProvider
);

export default router;