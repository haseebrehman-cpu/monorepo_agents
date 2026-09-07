const TARGET = (
  process.env.CHAT_API_URL ||
  process.env.VITE_CHAT_API_URL ||
  "https://backend-staging-1a2f.up.railway.app"
).replace(/\/+$/, "");

export const config = { runtime: "edge" };

function targetUrl(request: Request): string {
  const incoming = new URL(request.url);
  const stripped = incoming.pathname.replace(/^\/(?:rdx-api|api\/proxy)\//, "");
  return `${TARGET}/${stripped}${incoming.search}`;
}

export default async function handler(request: Request): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("content-length");

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(targetUrl(request), init);
  const outgoing = new Headers(upstream.headers);
  outgoing.delete("content-encoding");
  outgoing.delete("content-length");
  outgoing.delete("transfer-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outgoing,
  });
}
