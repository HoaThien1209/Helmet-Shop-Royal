import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { uploadsDir } from "./lib/uploads";

// Built frontend assets, when deployed as a single service alongside the storefront
// (see artifacts/royal-helmet-quang-tri/vite.config.ts for the matching outDir).
const frontendDist = path.join(__dirname, "../../royal-helmet-quang-tri/dist/public");
const hasFrontendBuild = fs.existsSync(frontendDist);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(uploadsDir));
app.use("/api", router);

// Serves the built storefront when it's bundled alongside the API in a single deployment.
// In local dev (no dist/public present) this is a no-op — Vite's own dev server handles the frontend.
if (hasFrontendBuild) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      next();
      return;
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
