# GitHub Actions SFTP Deployment Setup

## Required GitHub Repository Secrets

Go to your GitHub repository: https://github.com/Nyrk0/qualia_nss/settings/secrets/actions

Add these secrets:

### 1. SFTP_HOST
- **Value**: `qualia-nss.com` (or your hosting server's SFTP hostname)
- **Description**: The SFTP server hostname

### 2. SFTP_USERNAME  
- **Value**: Your hosting account username (usually your cPanel/hosting username)
- **Description**: SFTP login username

### 3. SFTP_PASSWORD
- **Value**: Your hosting account password or SFTP-specific password
- **Description**: SFTP login password
- **Note**: Some hosts require separate SFTP passwords - check with your hosting provider

### 4. SFTP_REMOTE_PATH
- **Value**: `/public_html` (or `/htdocs`, `/www`, depending on your host)
- **Description**: The remote directory path where files should be deployed
- **Common values**:
  - `/public_html` (most common)
  - `/htdocs` 
  - `/www`
  - `/domains/qualia-nss.com/public_html`

## How to Set Up

1. **Go to repository secrets**: https://github.com/Nyrk0/qualia_nss/settings/secrets/actions
2. **Click "New repository secret"** for each of the 4 secrets above
3. **Get your hosting credentials** from your hosting provider (cPanel, etc.)
4. **Test the deployment** by pushing to main branch or manually triggering the workflow

## Manual Workflow Trigger

You can manually trigger deployment without pushing:
1. Go to: https://github.com/Nyrk0/qualia_nss/actions/workflows/deploy.yml
2. Click "Run workflow"
3. Select "main" branch
4. Click "Run workflow"

## Troubleshooting

### Common Issues:
- **SFTP connection failed**: Check hostname and credentials
- **Permission denied**: Verify SFTP_REMOTE_PATH exists and is writable
- **Protocol not supported**: Some hosts only support FTPS - change `protocol: sftp` to `protocol: ftps` in the workflow

### Getting Help:
Contact your hosting provider for:
- Correct SFTP hostname (might be different from domain name)
- SFTP username and password
- Correct remote path for your domain
- Whether SFTP or FTPS is supported

## Workflow Features

- **Automatic deployment** on every push to main branch
- **Manual deployment** via GitHub Actions interface  
- **Secure file transfer** using SFTP protocol
- **Smart exclusions** - skips .git, .github, dev/, and system files
- **Verbose logging** for troubleshooting