import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import routes from "./routes/index.js";

const app = express();
if (env.TRUST_PROXY_HOPS > 0) {
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
}
const allowedOrigins = new Set(
  env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

app.use(
  helmet({
    // The dashboard is a separate origin; same-origin CORP blocks those fetches.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
}));

app.use((req, res, next) => {
  const origin = req.get("origin");
  if (safeMethods.has(req.method) || !origin || allowedOrigins.has(origin)) {
    next();
    return;
  }
  res.status(403).json({ success: false, error: "ORIGIN_NOT_ALLOWED" });
});

app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true, limit:"100kb", parameterLimit:200}));

app.use(pinoHttp({
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers.set-cookie",
    ],
}));

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "cts-backend",
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
    })
});

app.use("/api", routes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "NOT_FOUND" });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  const status =
    typeof err === "object" && err && "status" in err && typeof err.status === "number"
      ? err.status
      : 500;
  if (status >= 500) {
    if (req.log) req.log.error({ err }, "unhandled request error");
    else console.error("[app] unhandled request error:", err);
    return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
  }
  const type =
    typeof err === "object" && err && "type" in err && typeof err.type === "string"
      ? err.type
      : "";
  const error =
    type === "entity.too.large"
      ? "PAYLOAD_TOO_LARGE"
      : type === "entity.parse.failed"
        ? "INVALID_JSON"
        : "BAD_REQUEST";
  return res.status(status).json({ success: false, error });
});

export default app;

