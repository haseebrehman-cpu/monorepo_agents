import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import routes from "./routes/index.js";

const app = express();
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
app.use(express.urlencoded({extended:true}));

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

export default app;

