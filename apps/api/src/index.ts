import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ChatRequestBody } from "@rdx/chat-contract";
import { handleChatRequest } from "./routes/chat.js";

const PORT = Number(process.env.PORT ?? 8787);
const STORE_NAME = process.env.STORE_NAME?.trim() || "RDX Store";
const CORS_ORIGINS = (process.env.CORS_ORIGINS ??
  "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown,
): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function applyCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw) as unknown;
}

const server = createServer(async (req, res) => {
  try {
    if (applyCors(req, res)) return;

    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { ok: true, service: "@rdx/api" });
      return;
    }

    if (req.method === "POST" && url.pathname === "/v1/chat") {
      let body: ChatRequestBody;
      try {
        body = (await readJsonBody(req)) as ChatRequestBody;
      } catch {
        sendJson(res, 400, { error: "Invalid JSON body." });
        return;
      }

      const result = await handleChatRequest(body, STORE_NAME);
      const status = "error" in result ? 400 : 200;
      sendJson(res, status, result);
      return;
    }

    sendJson(res, 404, { error: "Not found." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    sendJson(res, 500, { error: message });
  }
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `@rdx/api could not bind http://127.0.0.1:${PORT} — port already in use.`,
    );
    console.error(
      "Stop the other process, or set PORT to a free port (e.g. PORT=8788).",
    );
    process.exit(1);
  }
  throw error;
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`@rdx/api listening on http://127.0.0.1:${PORT}`);
});
