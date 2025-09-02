# GitHub Actions FTPS Deployment Setup

## ✅ Working Configuration

This documents the **successful deployment setup** for qualia-nss.com using GitHub Actions with FTPS protocol.

## Required GitHub Repository Secrets

Go to your GitHub repository: https://github.com/Nyrk0/qualia_nss/settings/secrets/actions

Add these **4 repository secrets** (not environment secrets):

### 1. SFTP_HOST
- **Value**: `162.249.168.66` (server IP from PremiumHosting email)
- **Description**: The FTPS server hostname/IP

### 2. SFTP_USERNAME  
- **Value**: `qualiann` (from PremiumHosting email)
- **Description**: FTPS login username

### 3. SFTP_PASSWORD
- **Value**: `Mfc28!1WB!9` (from PremiumHosting email)
- **Description**: FTPS login password

### 4. SFTP_REMOTE_PATH
- **Value**: `/domains/qualia-nss.com/public_html/` (note the trailing slash!)
- **Description**: The remote directory path where files should be deployed
- **IMPORTANT**: Must end with `/` for the FTP-Deploy-Action

## Working GitHub Workflow

The successful workflow file at `.github/workflows/deploy.yml`:

```yaml
# A name for your entire workflow
name: Deploy Website via FTPS

# Specifies the trigger for this workflow
on:
  push:
    branches: [ "main" ]
  workflow_dispatch: # Allows you to run this workflow manually

# A workflow run is made up of one or more jobs
jobs:
  deploy:
    # The 'name' is what shows up in the GitHub UI
    name: Deploy to Server
    
    # Each job needs a runner environment to execute on
    runs-on: ubuntu-latest

    # 'steps' are the sequence of tasks that will be executed
    steps:
      # Step 1: Check out your repository's code so the runner can access it
      - name: Checkout code
        uses: actions/checkout@v4

      # Step 2: Your FTPS deployment step, correctly indented
      - name: Deploy to server via FTPS
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USERNAME }}
          password: ${{ secrets.SFTP_PASSWORD }}
          protocol: ftps
          local-dir: ./
          server-dir: ${{ secrets.SFTP_REMOTE_PATH }}
          exclude: |
            **/.git*
            **/.github/**
            **/node_modules/**
            **/dev/**
            **/docs/**
            **/.DS_Store
          dry-run: false
          log-level: verbose
```

## How It Works

1. **Trigger**: Automatically deploys on push to `main` branch or manual trigger
2. **Protocol**: Uses FTPS (not SFTP) which is supported by PremiumHosting
3. **Files**: Deploys all files except excluded development/system files
4. **Target**: Files go to `/domains/qualia-nss.com/public_html/` on the server

## Manual Workflow Trigger

You can manually trigger deployment without pushing:
1. Go to: https://github.com/Nyrk0/qualia_nss/actions
2. Click "Deploy Website via FTPS" workflow
3. Click "Run workflow"
4. Select "main" branch
5. Click "Run workflow"

## Deployment Pipeline

**Your complete workflow:**
1. **Code locally** in `/Users/admin/Documents/Developer/qualia_nss/`
2. **Push to GitHub** with `git push origin main`
3. **GitHub Actions automatically deploys** via FTPS to qualia-nss.com
4. **Live site updates** at https://qualia-nss.com

## Key Learnings

### What Works ✅
- **Protocol**: `ftps` (FTPS over SSL)
- **Server**: IP address `162.249.168.66` instead of domain name
- **Action**: `SamKirkland/FTP-Deploy-Action@v4.3.5`
- **Path**: Must end with trailing slash `/`
- **Secrets**: Repository-level secrets (not environment secrets)

### What Doesn't Work ❌
- **SFTP**: Not supported by SamKirkland/FTP-Deploy-Action for this server
- **Domain as host**: `qualia-nss.com` doesn't work, use IP instead
- **No trailing slash**: Server-dir path must end with `/`
- **Environment secrets**: Workflow needs repository secrets

## Troubleshooting

### Common Issues Resolved:
- **"server not recognized"**: Use IP `162.249.168.66` not domain name
- **"protocol: invalid parameter"**: Use `ftps` not `sftp`
- **"server-dir should be a folder"**: Add trailing slash `/` to path
- **"Input required: server"**: Use repository secrets not environment secrets

### File Exclusions:
The workflow excludes development files:
- `**/dev/**` - Development files and wireframes
- `**/docs/**` - Documentation and hosting emails  
- `**/.git*` - Git repository files
- `**/.github/**` - GitHub workflow files
- `**/node_modules/**` - Node.js dependencies
- `**/.DS_Store` - macOS system files

## Server Information (from PremiumHosting)

- **Server**: DA008 PRO - DC NY
- **IP**: 162.249.168.66  
- **Username**: qualiann
- **Password**: Mfc28!1WB!9
- **Domain**: qualia-nss.com
- **Path**: /domains/qualia-nss.com/public_html/
- **DirectAdmin**: https://162.249.168.66:2222/ or https://qualia-nss.com:2222/

## Live Site

Your audio analysis toolkit is now live at:
- **Main site**: https://qualia-nss.com
- **7-Band Level Meter**: https://qualia-nss.com/modules/7band-level-meter/
- **Spectrogram**: https://qualia-nss.com/modules/spectrogram/  
- **Spectrum Analyzer**: https://qualia-nss.com/modules/spectrum-analyzer/
- **Comb Filtering**: https://qualia-nss.com/modules/comb-filtering/

## Deployment Success! 🎉

The deployment pipeline is now fully functional. Any push to the main branch will automatically update your live website.