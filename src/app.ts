import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import applicationsRoutes from "./routes/applications.routes";
import { errorHandler } from "./middleware/error.middleware";
import requestLogger from "./middleware/logger.middleware";
import healthRoutes from "./routes/health.routes";
import providerRegistryRoutes from "./routes/provider-registry.routes"

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://nahuela-web.onrender.com",
    ],
  })
);

app.use(express.json());

app.use(requestLogger);

app.use(
  "/providers",
  providerRegistryRoutes
);

app.use("/", authRoutes);
app.use("/applications", applicationsRoutes);
app.use("/", healthRoutes);

app.use(errorHandler);

export default app;