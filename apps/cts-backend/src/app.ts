import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import routes from "./routes/index.js";

const app = express();

app.use(helmet());

app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true}));

app.use(pinoHttp());

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

