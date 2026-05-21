# Deploy public site (frontend) to Vercel

## Project settings

| Setting | Value |
|--------|--------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` (default; also in `frontend/vercel.json`) |
| **Install Command** | `npm install` (default) |
| **Output Directory** | *(leave empty)* |

Do **not** use the repo root `vercel.json` commands (`--prefix admin`) — that file is for the **admin** app only.

## Environment variables

| Name | Example |
|------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-api.example.com` |

Use your production backend URL (no trailing slash).

## Separate Vercel projects

| App | Root Directory |
|-----|----------------|
| Public site | `frontend` |
| Admin panel | `admin` |
