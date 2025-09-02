# Deployment and Auto‑Sync Workflows for qualia-nss.com

Last updated: 2025-08-24

## Overview
This document summarizes reliable ways to edit locally and deploy automatically to your hosting for `qualia-nss.com`. Choose the option that matches your host’s capabilities (SFTP/SSH vs FTP-only vs cPanel Git).

Project structure reference (local):
- `7band-level-meter/`
- `spectogram/`
- `spectrum-analyzer/`

Consider adding a root `index.html` that links to the above apps.

---

## Option A — GitHub Actions → SFTP/FTPS (recommended)
- Push to `main` and the workflow syncs files to your server.
- Requires SFTP or FTPS credentials.

Setup steps:
1) Put the project in a GitHub repo.
2) Add repository secrets:
   - `SFTP_HOST`, `SFTP_USERNAME`, `SFTP_PASSWORD` (or `SFTP_PRIVATE_KEY`)
   - `SFTP_REMOTE_PATH` (e.g., `/public_html` or `/var/www/html`)
3) Create `.github/workflows/deploy.yml` similar to:
```yaml
name: Deploy via SFTP/FTPS
on:
  push:
    branches: [ "main" ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # Optional: build/minify here

      - name: Sync to server
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USERNAME }}
          password: ${{ secrets.SFTP_PASSWORD }}
          protocol: sftp # change to ftps if only FTPS is supported
          local-dir: .
          server-dir: ${{ secrets.SFTP_REMOTE_PATH }}
          exclude: |
            **/.git*
            **/.github/**
            **/node_modules/**
            **/.DS_Store
```
Notes:
- Switch `protocol` to `ftps` if SFTP isn’t available.
- The workflow uploads only changed files by default and supports deletes.

---

## Option B — Local one‑command deploy: rsync over SSH
- Run a single command to sync changed files.
- Requires SSH access.

Example `Makefile`:
```makefile
REMOTE=youruser@qualia-nss.com
REMOTE_PATH=/public_html
SRC=.

deploy:
	rsync -azP --delete \
	  --exclude '.git' --exclude '.github' --exclude 'node_modules' \
	  $(SRC)/ $(REMOTE):$(REMOTE_PATH)/
```
Usage:
```bash
make deploy
```

---

## Option C — VS Code integrated sync
- Editor-based push/pull without CI.
- Extensions: “SFTP” (or “FTP-Simple”) for auto-upload on save; “Remote - SSH” to edit live on the server.
- Tip: Upload to a staging directory, then move to `public_html` to avoid partial updates.

---

## Option D — cPanel Git (if supported)
- Configure cPanel’s “Git Version Control” to pull from GitHub.
- Point the repo’s deploy path to your document root.
- Usually a one-time setup; then pull on push or via webhook.

---

## Option E — Static hosts (optional migration)
- Netlify, Cloudflare Pages, or Vercel auto-build on push.
- Point DNS for `qualia-nss.com` to the chosen platform.
- Great for static sites; minimal server maintenance.

---

## Secrets and Paths Checklist
- Hostname: `SFTP_HOST` (e.g., `qualia-nss.com`)
- Username: `SFTP_USERNAME`
- Auth: `SFTP_PASSWORD` or `SFTP_PRIVATE_KEY`
- Remote path: `SFTP_REMOTE_PATH` (e.g., `/public_html`)
- Protocol: `sftp` preferred; fall back to `ftps` if needed
- Exclusions: `.git`, `.github`, `node_modules`, `.DS_Store`

---

## Recommended next steps
- Confirm what your host supports: SFTP/SSH, FTPS/FTP only, cPanel Git.
- If using GitHub Actions, add the workflow and GitHub secrets.
- Optionally create a root landing `index.html` linking to:
  - `7band-level-meter/`
  - `spectogram/`
  - `spectrum-analyzer/`

Need help wiring any option? Provide your server path and protocol, and I’ll tailor the config exactly.
