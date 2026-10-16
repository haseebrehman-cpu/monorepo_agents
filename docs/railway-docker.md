# Deploy the chatbot on Railway

The GitHub repo is already connected. This deploy is **only** `apps/chatbot-react`. Do not add Postgres, and do not deploy `apps/cts-backend` or `apps/cts-dashboard`.

The chatbot in this repo is the React UI. It calls the chat API that is already running at `https://backend-production-0a592.up.railway.app`. That API is not built from this repo.

Railway builds whatever is on GitHub. The Docker files below are in the working tree and must be pushed before this service can build.

## 1. Push these files

From the repo root:

```powershell
git add .dockerignore railway.toml apps/chatbot-react/Dockerfile apps/chatbot-react/nginx.conf docs/railway-docker.md
git commit -m "Add Railway Docker build for the chatbot UI."
git push
```

Files:

| File | Purpose |
| --- | --- |
| `apps/chatbot-react/Dockerfile` | Builds the Vite app from the monorepo root, then serves `dist` with nginx |
| `apps/chatbot-react/nginx.conf` | Listens on Railway's `PORT` and falls back to `index.html` |
| `railway.toml` | Tells Railway to use that Dockerfile |
| `.dockerignore` | Keeps `node_modules` and `.env` out of the image |

`railway.toml` is at the repo root on purpose. The Docker context has to be the whole repo so `npm ci` can see the workspace lockfile and `packages/*`. Leave **Root Directory** empty. If you set it to `apps/chatbot-react`, the build cannot see `packages/` or `package-lock.json`.

## 2. Point the existing service at the Dockerfile

Open the service Railway created from this repo.

1. **Settings** → **Build**.
2. Builder: **Dockerfile**.
3. Dockerfile path: `apps/chatbot-react/Dockerfile`.
4. Root Directory: empty.
5. Config file path: `railway.toml` (Railway reads this from the repo root after the push).

A push after `railway.toml` is on GitHub should apply those settings. Confirm the path in the UI if the first build still tries to start the whole monorepo with Railpack.

## 3. Set variables before the build

Vite reads `VITE_*` while `npm run build` runs. Railway passes service variables into `docker build` as arguments. The Dockerfile declares those arguments. Set them, then deploy. Changing them later does nothing until you redeploy.

**Variables** → add:

| Variable | What to put |
| --- | --- |
| `VITE_CHAT_API_URL` | `https://backend-production-0a592.up.railway.app` |
| `VITE_STORE_NAME` | Store name shown in the widget. Empty becomes `RDX Sports`. |
| `VITE_STOREFRONT_HOST` | Storefront hostname, such as `rdxsports.co.uk`. No `https://`. |
| `VITE_TENANT` | Tenant sent with chat requests. Empty becomes `rdx`. |
| `VITE_SESSION_TOKEN` | Optional. Leave unset unless you already have a session token. When set, the app omits tenant and marketplace from the chat body. |

Do not set `PORT`. Railway sets it, and nginx listens on it.

No `DATABASE_URL`. This container is static files.

## 4. Deploy and open the domain

Deploy the service (or push, if auto-deploy is on).

When the deploy is **Success**, open **Settings** → **Networking** → **Generate Domain**.

The public URL is the chatbot. It is not the API.

## 5. Confirm it works

1. Open the generated `https://….up.railway.app` URL. The chat widget should render.
2. Send a message.
3. In the browser network tab, the chat request host should be `backend-production-0a592.up.railway.app`, not the new Railway hostname.

Localhost is different: `vite dev` sends chat through `/rdx-api`. The deployed hostname does not, so it uses `VITE_CHAT_API_URL`.

The chat API must allow this new Railway origin. If the widget loads and the send fails in the network tab with a CORS error, allow the new origin on that API.

## 6. If the build or the page fails

| What you see | What to change |
| --- | --- |
| Railway tries to run `npm run build` for the whole repo, or cannot find a start script | Builder is still Railpack. Set the Dockerfile path in step 2 and redeploy. |
| `npm ci` fails because a workspace package is missing | Root Directory is not the repo root. Clear it. |
| Build succeeds, site is blank, or assets 404 | The running container is not this nginx image. Confirm the Dockerfile path and that the latest commit is the one Railway built. |
| Widget loads, messages go to the Railway UI domain | `VITE_CHAT_API_URL` was empty when the image was built. Set it and redeploy. Restart is not enough. |
| Widget loads, send fails with a CORS error | The existing chat API does not allow this domain yet. |
| `npm start` or `vite preview` in the logs | Wrong start command. Clear any custom start command. This image starts nginx from the Dockerfile. The npm `start` script binds to `127.0.0.1`, which Railway cannot reach. |
