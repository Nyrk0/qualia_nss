# Deployment and Auto‑Sync Workflows for qualia-nss.com

Last updated: 2025-08-26

## Overview
This document summarizes reliable ways to edit locally and deploy automatically to your hosting for `qualia-nss.com`. Choose the option that matches your host's capabilities (SFTP/SSH vs FTP-only vs cPanel Git).

**Current Project Structure:**
- Root `index.html` - Main application shell with navbar and SPA routing
- `src/` - Module directories (speakers/, filters/, cabinets/, tests/)
- `7band-level-meter/` - Standalone 7-band level meter app
- `spectogram/` - Standalone 3D WebGL spectrogram app  
- `spectrum-analyzer/` - Standalone spectrum analyzer app
- `comb-filtering/` - JavaScript library for comb filtering detection

**UI Implementation Complete:** Electric blue themed navbar with Bootstrap integration, responsive design, and modular SPA architecture.

---

## Option A — GitHub Actions → SFTP/FTPS (recommended) ✅ ACTIVE

**Status:** Currently deployed and working at https://github.com/Nyrk0/qualia_nss

Push to `main` and the workflow syncs files to your server via FTPS.

**Working Configuration:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to qualia-nss.com
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Deploy to server
      uses: SamKirkland/FTP-Deploy-Action@v4.3.5
      with:
        server: qualia-nss.com
        username: ${{ secrets.FTPS_USERNAME }}
        password: ${{ secrets.FTPS_PASSWORD }}
        protocol: ftps
        server-dir: public_html/
```

**GitHub Secrets Required:**
- `FTPS_USERNAME` - FTP username 
- `FTPS_PASSWORD` - FTP password

**Security:** Directory listing blocked via `.htaccess`, dev/ folder protected

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

## Current Status ✅

**Deployment:** GitHub Actions with FTPS is active and working
**UI:** Complete navbar shell with SPA routing for audio analysis modules
**Security:** Directory protection and proper routing implemented

**Live Structure:**
- Root: Modern web app shell with electric blue theme
- Modules: Speakers, Filters, Cabinets, Tests with interactive controls
- Legacy apps: 7-band level meter, 3D spectrogram, spectrum analyzer available

**Next Development:** Module functionality implementation (Web Audio API integration)
