# Obra — Session Handoff (continue here)

Moshe's contractor platform (formerly "BQ Tools"). Goal: beta testing → raise millions. Talk short, direct, Hebrew. Previous session's tool-calls kept breaking mid-task — resume cleanly from below.

## FIRST TASK (unfinished — do this first)
Embed the logo video at the top of the homepage hero:
- Source: `/Users/mosheshohet/output/iso-edit/out/iso-edit.mp4` (1280x720, 10s)
- Copy to: `~/Projects/bq-tools/video/iso-edit.mp4`
- Place: inside the `.hero` in `~/Projects/bq-tools/index.html`, under the nav (nav = lines ~543-555; `.hero` CSS ~line 96; hero HTML starts ~line 556)
- Design: rectangle with large `border-radius` (~36px, iPhone-frame style), subtle drop shadow below, centered, responsive. `<video autoplay loop muted playsinline>` with `<source src="/video/iso-edit.mp4" type="video/mp4">`
- Deploy: `cd ~/Projects/bq-tools && git add -A && git commit -m "..." && git push` (Cloudflare Pages auto-deploys). Live: https://bq-tools.fanzai-mgmt.workers.dev
- Report only when deploy is live, with the URL.

## ONGOING JOB: Obra Beta WhatsApp group
- Bridge: `~/wa-bridge` (`node server.js`, port 8787). Extended with: `GET /groups`, `POST /send {jid,message}`, media capture to `~/wa-bridge/media/`.
- Group "Obra Beta Crew" = JID `120363427479193348@g.us`
- Send: `curl -s -X POST http://localhost:8787/send -H "Content-Type: application/json" -d '{"jid":"120363427479193348@g.us","message":"..."}'`
- Read incoming: `grep '120363427479193348' ~/wa-bridge/inbox_all.jsonl` (each line has name/text/mediaType/mediaPath)
- If a tester posts image/video → saved to `~/wa-bridge/media/` → analyze with `/watch` skill before replying.
- First tester: **גל (Gal)**, 972545830237, Remodelling/flooring/tiles, prefers Hebrew. Uploaded a tile video; was asked for feedback on the Video Brain output — awaiting reply. Check if he answered, reply personally.
- Each new member: greet personally, ask name/trade/weekly-quote-volume, walk through first Video Brain upload, collect feedback on 3 things: (1) work plan accurate? (2) Spanish crew sheet usable? (3) price estimate close?
- PRIVACY (hard): no cross-user data; no Moshe data without his approval; minimal disclosure; beta scoped to this group only.

## Infra already built/deployed
- Repo `~/Projects/bq-tools` (git `fanzaimgmt-art/bq-tools` main, auto-deploy on push). API: `cd api && wrangler deploy` (worker `bq-tools-api`, KV `BQ_USERS`).
- Worker already deployed with: `betaCohort`/`firstUploadAt`/`activatedAt`/`feedbackCount` fields, auto activation-stamp on each successful video analyze, and admin endpoints `POST /api/admin/beta-tag` + `GET /api/admin/beta-funnel` (gated by `ADMIN_PASSWORD` secret — ask Moshe for it to tag testers).
- `BETA_OPS_PLAN.md`, `ops/site-fixer-prompt.md`, `ops/health-monitor.sh` in repo.
- Health monitor + group watcher were background bash loops — relaunch if not running. On a confirmed site problem, spawn a site-fixer agent using `ops/site-fixer-prompt.md` (web-app-building/frontend/cloudflare skills) → fix → verify → deploy.

## Logo (done, reference)
- Chosen direction: isometric 3D construction site that builds "Obra" in gold. Files: `~/Projects/bq-tools/img/logo-iso/` + `img/logo-3d/`. Clean final wordmark: `img/logo-3d/clean-iso.jpeg`.
- Animation: Seedance 2 Elements (Image1 = clean-iso clean logo, Image2 = iso-1-classic construction site). Already rendered → `iso-edit.mp4` (the file for the FIRST TASK).
- Generation via Kolbo MCP (`mcp__kolbo__generate_image`, models `nano-banana-pro`/`gpt-image-2`). ~1850 credits left.

## Notes
- caveman mode is active in-session (short replies).
- Some MCP servers need auth — run `/mcp` if needed.
- Relevant memory: `project_bq_tools.md`, `feedback_obra_beta_privacy.md`.
