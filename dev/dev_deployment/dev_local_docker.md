# Docker Development Environment Setup

## Overview
This guide provides step-by-step instructions to set up a local Docker development environment for the Qualia NSS project with PHP 8.1, Apache, and MariaDB 11.8.2.

## Prerequisites
- Docker Desktop installed and running
- Basic command line knowledge
- Access to the project directory

## Project Structure
```
qualia_nss/
├── Dockerfile              # Custom Docker image definition
├── .htaccess              # Apache configuration (volume mounted)
├── index.html             # Main application entry point
├── src/                   # Application source code
├── dev_deployment/        # This documentation
└── [other project files]  # Volume mounted to container
```

## Docker Configuration

### Dockerfile
Location: `./Dockerfile`

```dockerfile
# Use official PHP 8.1 image with Apache (HTTPD) pre-installed
FROM php:8.1-apache

# Install system dependencies for MariaDB
RUN apt-get update && apt-get install -y \
    gnupg2 \
    wget \
    curl \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install MariaDB Server (latest available version)
RUN apt-get update && apt-get install -y \
    mariadb-server \
    mariadb-client \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions for MySQL connectivity
RUN docker-php-ext-install mysqli pdo_mysql

# Enable Apache modules if needed (mod_rewrite is useful for many apps)
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Create working directory (files will be volume mounted from host)
# Note: COPY is commented out to prioritize volume mounting for development
# COPY . /var/www/html

# Set proper permissions for web server
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Expose ports 80 (Apache) and 3306 (MariaDB)
EXPOSE 80 3306
```

### .htaccess Configuration Issue
**Important**: The original `.htaccess` file contained a `<Directory>` directive which is not allowed in `.htaccess` files:

```apache
# This caused Internal Server Error
<Directory "dev">
    Order allow,deny
    Deny from all
</Directory>
```

**Solution**: Remove `<Directory>` directives from `.htaccess` as they can only be used in main Apache configuration files.

## Step-by-Step Setup

### 1. Clean Previous Containers (if any)
```bash
# Stop and remove any existing containers
docker ps -a
docker stop <container_id>
docker rm <container_id>
```

### 2. Build Docker Image
```bash
# From project root directory
docker build -t qualia-nss .
```

### 3. Run Container
```bash
# Start container with volume mounting (REQUIRED for development)
docker run -d --name qualia-nss -p 8080:80 -p 3306:3306 -v "$(pwd)":/var/www/html qualia-nss
```

**Important**: The `-v "$(pwd)":/var/www/html` flag is **essential** for development as it:
- Mounts your local project directory into the container
- Enables live file editing without rebuilding the image
- Ensures changes to PHP, HTML, CSS, and JS files are immediately reflected

### 4. Verify Container Status
```bash
# Check if container is running
docker ps

# Check container logs
docker logs qualia-nss --tail 10
```

## Access Points

### Web Application
- **URL**: http://localhost:8080
- **Protocol**: HTTP
- **Port**: 8080 (mapped to container port 80)

### MariaDB Database
- **Host**: localhost
- **Port**: 3306
- **Version**: MariaDB 11.8.2
- **Client**: `mariadb-client` available in container

## Troubleshooting

### Internal Server Error (500)
**Symptom**: Browser shows "Internal Server Error"

**Common Cause**: `.htaccess` file contains directives not allowed in `.htaccess`

**Check Logs**:
```bash
docker logs qualia-nss --tail 20
```

**Look For**: `<Directory not allowed here` error messages

**Solution**:
```bash
# Fix .htaccess directly in container
docker exec qualia-nss sed -i '/# Prevent access to dev directory in production/,$d' /var/www/html/.htaccess

# Reload Apache
docker exec qualia-nss service apache2 reload
```

### Container Won't Start
**Check**: Port conflicts
```bash
# Find what's using port 8080
lsof -i :8080

# Use different port if needed
docker run -d --name qualia-nss -p 8081:80 -p 3307:3306 qualia-nss
```

### Volume Mounting Issues
**Verify Files**:
```bash
# Check files are mounted correctly
docker exec qualia-nss ls -la /var/www/html

# Verify specific files are volume mounted (not copied at build time)
docker exec qualia-nss head -5 /var/www/html/src/wiki-utils/index.js
```

**Common Issue**: Container built without volume mount
```bash
# Solution: Stop, remove, and recreate with volume mount
docker stop qualia-nss && docker rm qualia-nss
docker run -d --name qualia-nss -p 8080:80 -p 3306:3306 -v "$(pwd)":/var/www/html qualia-nss
```

**Check Volume Mount Status**:
```bash
# Inspect container mounts
docker inspect qualia-nss | grep -A 5 -B 5 Mounts
```

### Apache Configuration
**Check Configuration**:
```bash
# View Apache error log location
docker exec qualia-nss cat /etc/apache2/apache2.conf | grep ErrorLog

# Check Apache status
docker exec qualia-nss service apache2 status
```

## Development Workflow

### 1. Start Development
```bash
# Start container
docker start qualia-nss

# Verify it's running
docker ps
```

### 2. Make Code Changes
- Edit files in your local project directory
- **Changes are immediately reflected in container via volume mount**
- No need to rebuild image for code changes
- **Wiki module changes**: Files like `src/wiki-utils/index.js` update instantly
- **PHP files**: Scripts like `src/wiki-utils/generate-toc.php` execute with latest changes

### 3. Debug Issues
```bash
# View real-time logs
docker logs -f qualia-nss

# Access container shell
docker exec -it qualia-nss bash
```

### 4. Stop Development
```bash
# Stop container (keeps data)
docker stop qualia-nss

# Remove container (loses data)
docker rm qualia-nss
```

## Container Management

### Useful Commands
```bash
# List all containers
docker ps -a

# Start stopped container
docker start qualia-nss

# Stop running container
docker stop qualia-nss

# Remove container
docker rm qualia-nss

# Remove image
docker rmi qualia-nss

# View container logs
docker logs qualia-nss

# Execute command in container
docker exec qualia-nss <command>

# Open shell in container
docker exec -it qualia-nss bash
```

### Database Operations
```bash
# Access MariaDB in container
docker exec -it qualia-nss mariadb

# Check MariaDB status
docker exec qualia-nss service mariadb status

# Start MariaDB (if stopped)
docker exec qualia-nss service mariadb start
```

## Environment Specifications

### Software Versions
- **Base Image**: php:8.1-apache (Debian-based)
- **PHP**: 8.1.33
- **Apache**: 2.4.65
- **MariaDB**: 11.8.2
- **OS**: Debian Trixie

### PHP Extensions Included
- `mysqli` - MySQL Improved Extension
- `pdo_mysql` - PDO MySQL driver

### Apache Modules Enabled
- `mod_rewrite` - URL rewriting

## Security Notes

### File Permissions
- Web files owned by `www-data:www-data`
- Permissions set to `755` for directories, `644` for files

### Access Restrictions
- `.htaccess` includes security headers
- Sensitive file types (`.md`, `.log`) blocked via Apache directives

### Database Security
- MariaDB runs inside container (isolated)
- No default root password set (development only)
- For production: implement proper authentication

## Notes and Considerations

### Development vs Production
- This setup is for **development only**
- Production deployments need additional security, SSL, etc.
- Volume mounting is convenient for development but not for production

### Performance
- Container includes both web server and database
- For high-performance needs, consider separate containers
- Volume mounting can be slower than copying files

### Data Persistence
- Database data is stored inside container
- Data lost when container is removed
- For persistent data, use Docker volumes

## Comparison with Previous Setup

### Before (Simple PHP Container)
```bash
docker run -d --name qualia-nss -p 8080:80 -v "$(pwd)":/var/www/html php:8.4-apache
```
- **Pros**: Simple, quick setup
- **Cons**: No database, newer PHP version, different Apache config

### Now (Custom Image)
```bash
docker build -t qualia-nss . && docker run -d --name qualia-nss -p 8080:80 -p 3306:3306 qualia-nss
```
- **Pros**: Includes MariaDB, matches production PHP version, controlled environment
- **Cons**: Requires Dockerfile, longer setup time, `.htaccess` compatibility issues

### Key Differences
1. **Apache Configuration**: Stricter in php:8.1-apache vs php:8.4-apache
2. **Database**: Now included (MariaDB 11.8.2)
3. **PHP Version**: 8.1 (production match) vs 8.4 (latest)
4. **Setup Complexity**: Custom Dockerfile vs simple run command

---

**Last Updated**: September 2, 2025  
**Container ID**: c4152eabb31b  
**Status**: Working ✅