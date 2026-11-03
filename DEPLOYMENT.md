# Deploying DentaAI

DentaAI is three services plus a database. **Vercel can host exactly one of them** — the React
frontend. The other pieces need somewhere that runs a long-lived process.

| Piece | Goes on Vercel? | Why |
| --- | --- | --- |
| React frontend (`frontend/`) | **Yes** | Static build; this is already deployed. |
| Node/Express API (`backend/`) | **No** | Socket.IO needs a persistent connection, which Vercel's serverless functions do not hold open. Uploads also write to local disk, which is ephemeral there. |
| Python/Flask AI service (`ai_model/`) | **No** | TensorFlow plus the MobileNetV2 checkpoint is far past Vercel's serverless bundle limit. A `Dockerfile` is provided for hosts that take containers. |
| MongoDB | **No** | Use MongoDB Atlas (the free M0 tier is enough for this project). |

So "deploy to Vercel" gets you the UI. Without the API hosted somewhere, the site loads and then
every request fails — which is the state the production URL is in today.

---

## Option A — local demo (recommended for the viva)

Run all three services on the laptop, as in the README. Nothing to configure, the AI model runs at
full speed, and there is no hosting bill. For an academic demonstration this is entirely normal, and
it is the only option that reliably shows the AI inference working.

Keep the Vercel deployment as a UI showcase and say plainly in the report that the AI service runs
locally. Do not leave a hosted URL that looks live but cannot do anything.

## Option B — host the full stack

### 1. Database
Create a free cluster on MongoDB Atlas, add a database user, allow access from your backend host,
and copy the connection string.

There is a Render blueprint at `render.yaml` covering both backend services. From the Render
dashboard: **New → Blueprint**, point it at this repository, then fill in the variables marked
`sync: false`. The steps below explain what each one is.

### 2. Node API
Deploy `backend/` to a host that runs a persistent Node process — Render, Railway and Fly.io all
have usable free or cheap tiers. Start command `npm start`. Set:

```
MONGODB_URI=<your Atlas connection string>
JWT_SECRET=<a long random string, not the one in any example file>
AI_SERVICE_URL=<URL of the Flask service, see below>
CORS_ORIGINS=https://<your-vercel-domain>.vercel.app
RAZORPAY_KEY_ID=<test key>
RAZORPAY_KEY_SECRET=<test secret>
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
ADMIN_EMAIL=...
```

**Known limitation — uploaded images do not survive a redeploy.** The Node API writes them to
`backend/uploads` on local disk. Free tiers on Render and Railway have an ephemeral filesystem, so
every deploy wipes them and scan images disappear from older reports (the report itself survives;
the image 404s and the UI shows its "no scan image available" state). The proper fix is object
storage — S3 or Cloudinary — and it is not done. On Render you can instead attach a persistent
disk mounted at `backend/uploads`, which needs a paid instance type.

### 3. Flask AI service
`ai_model/Dockerfile` builds the serving container. It installs `requirements-serve.txt` —
runtime dependencies only, using `tensorflow-cpu` — rather than the training `requirements.txt`,
which also pulls in jupyter, matplotlib, pandas and scikit-learn and roughly triples the image.

```bash
docker build -t dentaai-ai ./ai_model
docker run -p 5002:5002 dentaai-ai
```

Set `AI_ALLOWED_ORIGINS` to empty (only the Node API should call it) and leave `FLASK_DEBUG` unset.

**This is the service that will not fit on a free tier.** TensorFlow plus the loaded MobileNetV2
graph needs more than 512 MB of resident memory, so it is OOM-killed on Render's and Railway's
free instances. Expect to pay for the smallest paid tier, or not to host it.

**Skipping it is a perfectly reasonable choice.** Leave `AI_SERVICE_URL` unset on the Node API and
everything except AI scanning works on the hosted site; the scan page shows "AI analysis service is
currently unavailable", which is honest error handling rather than a crash. Run the Flask service
locally for the demo and say so in the report. Given that the AI model is the centrepiece of the
project, demonstrating it on a laptop where it has real CPU is better than demonstrating it on a
starved container anyway.

### 4. Frontend on Vercel
In the Vercel project settings:

- **Root Directory**: `frontend`
- **Environment Variables**:
  - `VITE_API_URL` = `https://<your-node-api-host>`
  - `VITE_RAZORPAY_KEY_ID` = your Razorpay test key id

Then redeploy. Vite inlines these at build time, so **changing them requires a new deployment** —
setting a variable alone does nothing to the build already live.

`frontend/vercel.json` handles SPA routing. Without it, visiting or refreshing any deep link such
as `/dashboard/patient/reports/abc123` returns a Vercel 404, because the browser asks for a file
that does not exist instead of letting React Router resolve it. If your Vercel project's Root
Directory is the repository root rather than `frontend`, move this file there.

---

## After deploying, check

1. Load the site, open the browser console, and confirm requests go to your API domain and not
   `localhost:5000`.
2. Refresh the page while on a deep link — it should render, not 404.
3. Register a patient, then log in.
4. Confirm `CORS_ORIGINS` on the API matches the Vercel domain exactly, including `https://`.
5. Open a consultation and send a chat message, to confirm the Socket.IO connection survives on
   your chosen host.

## Do not

- Commit a real `.env`. Both `.env.example` files list what is needed.
- Run `seedAdmin.js` or `seedDoctor.js` against the Atlas database. They create accounts with known
  passwords and deliberately refuse to run against a non-local database for that reason. Register
  the admin locally, or set `ALLOW_REMOTE_SEED=true` only if you understand what it exposes.
- Leave the production site pointing at a backend that is not running.
