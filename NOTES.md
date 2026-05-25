# Internet Keeda — engineering notes

Single-line facts that don't fit anywhere else. Add new ones at the top.

## 2026-05-25

- **n8n**: confirmed absent in Internet Keeda repo. Source-grep returns
  zero matches across `src/`, `public/`, `app/`, `components/`,
  `package.json`, `README.md`, env files. The only `n8n` byte
  sequences in the tree are inside binary blobs (original CodeCanyon
  ZIP, PNG/GIF assets) — false-positive byte coincidences, not
  references. Nothing to remove.

- **Categories dropdown** (carry-over from Area 7): verified live via
  `GET /api/categories` — returns 678 categories alphabetised
  (`360 images, 3D & Modeling, AI Agents, AI Art & Design, …`).
  Submit-tool server-side category validation in
  `src/app/api/tools/submit/route.ts` rejects unknown slugs with 400
  *after* the auth gate (anon submissions hit 401 first).
