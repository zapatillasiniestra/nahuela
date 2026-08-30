import { Router } from "express";
import controller from "../controllers/provider-registry.controller";

const router = Router();

router.get("/", controller.getProviders);

router.patch(
  "/:type/:name",
  controller.setEnabled
);

export default router;