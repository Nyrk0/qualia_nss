# Docker Backend Architecture Patterns

**Stage:** st01-backend-server  
**Version:** 1.0  
**Date:** 2025-09-03  
**Focus:** KISS Docker implementation patterns

## 1. Container Architecture Pattern

### 1.1. ASCII Container Structure
```
┌─────────────────────────────────────────────────────────────┐
│                DOCKER CONTAINER ARCHITECTURE               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HOST SYSTEM              │  DOCKER CONTAINER              │
│                           │                                 │
│  ┌─────────────────┐     │  ┌─────────────────────────┐    │
│  │  PROJECT ROOT   │────▶│  │    /var/www/html        │    │
│  │  (Volume Mount) │     │  │    (Web Document Root)  │    │
│  └─────────────────┘     │  └─────────────────────────┘    │
│                           │            │                    │
│  ┌─────────────────┐     │            ▼                    │
│  │  Port 8080      │◄────┼──┐  ┌─────────────────────────┐ │
│  │  (Development)  │     │  │  │      APACHE HTTPD       │ │
│  └─────────────────┘     │  │  │      (Port 80)          │ │
│                           │  │  └─────────────────────────┘ │
│  ┌─────────────────┐     │  │            │                 │
│  │  Port 3306      │◄────┼──┼────────────▼                 │
│  │  (Database)     │     │  │  ┌─────────────────────────┐ │
│  └─────────────────┘     │  │  │      PHP 8.1 RUNTIME   │ │
│                           │  │  │      (mod_php)          │ │
│                           │  │  └─────────────────────────┘ │
│                           │  │            │                 │
│                           │  │            ▼                 │
│                           │  │  ┌─────────────────────────┐ │
│                           │  └─▶│      MARIADB SERVER     │ │
│                              │  │      (Port 3306)        │ │
│                              │  └─────────────────────────┘ │
└─────────────────────────────┼──────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  INTERNAL ONLY  │
                    │  Container Net  │
                    └─────────────────┘
```

### 1.2. Mermaid Container Flow
```mermaid
graph TD
    subgraph "Host System"
        HOST_ROOT[Project Root Directory]
        HOST_8080[Host Port 8080]
        HOST_3306[Host Port 3306]
    end
    
    subgraph "Docker Container"
        subgraph "Web Layer"
            APACHE[Apache HTTP Server<br/>Port 80]
            PHP[PHP 8.1 Runtime<br/>mod_php]
            WEBROOT[/var/www/html<br/>Document Root]
        end
        
        subgraph "Data Layer"  
            MARIADB[MariaDB Server<br/>Port 3306]
            DATADIR[/var/lib/mysql<br/>Database Files]
        end
        
        subgraph "Process Layer"
            PHPFPM[PHP-FPM Processes]
            MYSQL_PROC[MySQL Processes]
        end
    end
    
    HOST_ROOT -->|Volume Mount| WEBROOT
    HOST_8080 -->|Port Mapping| APACHE
    HOST_3306 -->|Port Mapping| MARIADB
    
    APACHE --> PHP
    PHP --> PHPFPM
    PHP --> MARIADB
    MARIADB --> MYSQL_PROC
    MARIADB --> DATADIR
    
    classDef host fill:#fff2cc
    classDef web fill:#d4edda  
    classDef data fill:#f8d7da
    classDef process fill:#d1ecf1
    
    class HOST_ROOT,HOST_8080,HOST_3306 host
    class APACHE,PHP,WEBROOT web
    class MARIADB,DATADIR data
    class PHPFPM,MYSQL_PROC process
```

## 2. Development Workflow Patterns

### 2.1. Container Lifecycle Management
```bash
# KISS Pattern: Simple container management commands

# Build Pattern
docker build -t qualia-nss-backend .

# Development Run Pattern  
docker run -d \
  --name qualia-dev \
  -p 8080:80 \
  -p 3306:3306 \
  -v "$(pwd)":/var/www/html \
  qualia-nss-backend

# Health Check Pattern
curl http://localhost:8080/api/health

# Log Monitoring Pattern
docker logs -f qualia-dev

# Clean Restart Pattern
docker stop qualia-dev && docker rm qualia-dev
```

### 2.2. Development vs Production Patterns

**Development Pattern (Current):**
```dockerfile
# Volume mounting for live development
VOLUME ["/var/www/html"]
EXPOSE 80 3306

# Enable PHP error reporting
RUN echo "display_errors = On" >> /usr/local/etc/php/php.ini
```

**Production Pattern (Future st01f):**
```dockerfile
# Copy files instead of volume mounting
COPY . /var/www/html
EXPOSE 80

# Disable debugging, enable optimization  
RUN echo "display_errors = Off" >> /usr/local/etc/php/php.ini
RUN echo "opcache.enable = On" >> /usr/local/etc/php/php.ini
```

## 3. Service Integration Patterns

### 3.1. Apache + PHP Integration
```bash
# Service Status Check Pattern
docker exec qualia-dev service apache2 status
docker exec qualia-dev service mysql status

# PHP Configuration Verification
docker exec qualia-dev php -m | grep -E "(mysqli|pdo_mysql)"

# Apache Module Check
docker exec qualia-dev apache2ctl -M | grep rewrite
```

### 3.2. Database Connection Pattern
```php
// KISS Database Connection Pattern
class DatabaseConnection {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        $this->connection = new PDO(
            'mysql:host=localhost;dbname=qualia_nss',
            'root',
            '', // Development only - no password
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
}
```

## 4. File System Patterns

### 4.1. Directory Structure Pattern
```
/var/www/html/              # Web document root (volume mounted)
├── index.html              # Frontend application entry
├── src/                    # Frontend source code
├── api/                    # Backend API endpoints
│   ├── health.php          # Health check endpoint
│   ├── wiki/               # Wiki processing APIs
│   └── audio/              # Audio processing APIs
├── config/                 # Backend configuration
│   ├── database.php        # Database configuration
│   └── constants.php       # Application constants
├── uploads/                # File upload directory
│   ├── audio/              # Audio file storage
│   └── temp/               # Temporary processing
└── cache/                  # Response and data cache
    ├── wiki/               # Wiki TOC cache
    └── api/                # API response cache
```

### 4.2. File Permissions Pattern
```bash
# KISS Permission Setup (Development)
docker exec qualia-dev chown -R www-data:www-data /var/www/html
docker exec qualia-dev chmod -R 755 /var/www/html
docker exec qualia-dev chmod -R 775 /var/www/html/uploads
docker exec qualia-dev chmod -R 775 /var/www/html/cache
```

## 5. API Development Patterns

### 5.1. Basic API Structure Pattern
```php
<?php
// api/health.php - KISS Health Check Pattern

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Database connection test
    $db = DatabaseConnection::getInstance();
    $pdo = $db->getConnection();
    $pdo->query('SELECT 1');
    
    $response = [
        'status' => 'ok',
        'timestamp' => date('c'),
        'services' => [
            'apache' => 'running',
            'php' => PHP_VERSION,
            'database' => 'connected'
        ]
    ];
    
    http_response_code(200);
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    $response = [
        'status' => 'error',
        'message' => $e->getMessage(),
        'timestamp' => date('c')
    ];
    
    http_response_code(500);
    echo json_encode($response, JSON_PRETTY_PRINT);
}
?>
```

### 5.2. Frontend-Backend Communication Pattern
```javascript
// Frontend API Communication Pattern (ES6)
class BackendAPI {
    constructor() {
        this.baseURL = 'http://localhost:8080/api';
    }
    
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Backend health check failed:', error);
            return { status: 'error', message: error.message };
        }
    }
    
    async uploadAudio(file) {
        const formData = new FormData();
        formData.append('audio', file);
        
        try {
            const response = await fetch(`${this.baseURL}/audio/upload`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Audio upload failed:', error);
            return { status: 'error', message: error.message };
        }
    }
}
```

## 6. Database Patterns

### 6.1. Schema Migration Pattern
```sql
-- migrations/001_initial_schema.sql
-- KISS Database Schema Pattern

CREATE DATABASE IF NOT EXISTS qualia_nss 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE qualia_nss;

-- User authentication
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audio file metadata
CREATE TABLE audio_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    metadata JSON,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wiki cache for TOC generation
CREATE TABLE wiki_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_path VARCHAR(500) UNIQUE NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    toc_json JSON NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL
);
```

### 6.2. Database Initialization Pattern
```bash
# Database setup in container
docker exec qualia-dev mysql -u root -e "SOURCE /var/www/html/migrations/001_initial_schema.sql"

# Verify tables created
docker exec qualia-dev mysql -u root -e "USE qualia_nss; SHOW TABLES;"
```

## 7. Debugging and Monitoring Patterns

### 7.1. Log Monitoring Pattern
```bash
# Container logs
docker logs -f qualia-dev

# Apache access logs
docker exec qualia-dev tail -f /var/log/apache2/access.log

# Apache error logs  
docker exec qualia-dev tail -f /var/log/apache2/error.log

# MySQL error logs
docker exec qualia-dev tail -f /var/log/mysql/error.log
```

### 7.2. Development Debug Pattern
```php
// Debug helper for development
class DebugHelper {
    public static function log($message, $data = null) {
        if ($_ENV['ENVIRONMENT'] === 'development') {
            $logEntry = [
                'timestamp' => date('c'),
                'message' => $message,
                'data' => $data
            ];
            
            error_log(json_encode($logEntry), 3, '/var/log/qualia-debug.log');
        }
    }
    
    public static function response($data) {
        if ($_ENV['ENVIRONMENT'] === 'development') {
            $data['debug'] = [
                'memory_usage' => memory_get_usage(true),
                'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
            ];
        }
        return $data;
    }
}
```

## 8. Deployment Patterns

### 8.1. Local Development Setup
```bash
#!/bin/bash
# setup-dev-environment.sh - KISS Development Setup

echo "Setting up Qualia-NSS development environment..."

# Build container
docker build -t qualia-nss-backend .

# Stop existing container if running
docker stop qualia-dev 2>/dev/null || true
docker rm qualia-dev 2>/dev/null || true

# Run new container
docker run -d \
  --name qualia-dev \
  -p 8080:80 \
  -p 3306:3306 \
  -v "$(pwd)":/var/www/html \
  qualia-nss-backend

# Wait for services to start
sleep 5

# Initialize database
docker exec qualia-dev mysql -u root -e "SOURCE /var/www/html/migrations/001_initial_schema.sql"

# Test health endpoint
curl -s http://localhost:8080/api/health | jq '.'

echo "Development environment ready at http://localhost:8080"
```

### 8.2. Production Deployment Pattern (Future st01f)
```bash
#!/bin/bash
# deploy-production.sh - Production Deployment Pattern

# Build production image (no development tools)
docker build -f Dockerfile.prod -t qualia-nss-prod .

# Deploy with production configuration
docker run -d \
  --name qualia-prod \
  -p 80:80 \
  --restart unless-stopped \
  -v /var/log/qualia:/var/log \
  -e ENVIRONMENT=production \
  qualia-nss-prod
```

---

**KISS Compliance:**
- ✅ Simple container management commands
- ✅ Clear separation of development vs production patterns  
- ✅ Minimal configuration complexity
- ✅ Testable at each integration point
- ✅ Easy rollback through container recreation
- ✅ Progressive complexity from basic to advanced patterns