#!/bin/bash

# Script to check your current hosting server configuration
# Run this on your hosting server to understand your setup

echo "🔧 Checking hosting server configuration..."
echo ""

# Check web server type
echo "=== Web Server Detection ==="
if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
    echo "✅ Apache detected"
    
    # Find Apache config
    if [ -f "/etc/apache2/sites-available/000-default.conf" ]; then
        echo "📄 Apache config: /etc/apache2/sites-available/000-default.conf"
        echo "Current DocumentRoot:"
        grep -n "DocumentRoot" /etc/apache2/sites-available/000-default.conf
    fi
    
    if [ -f "/etc/httpd/conf/httpd.conf" ]; then
        echo "📄 Apache config: /etc/httpd/conf/httpd.conf"
        echo "Current DocumentRoot:"
        grep -n "DocumentRoot" /etc/httpd/conf/httpd.conf
    fi
fi

if command -v nginx &> /dev/null; then
    echo "✅ Nginx detected"
    
    # Find Nginx config
    if [ -f "/etc/nginx/sites-available/default" ]; then
        echo "📄 Nginx config: /etc/nginx/sites-available/default"
        echo "Current root directive:"
        grep -n "root" /etc/nginx/sites-available/default
    fi
fi

echo ""
echo "=== Current Document Root ==="
# Check common document root locations
common_roots=(
    "/var/www/html"
    "/var/www"
    "/usr/share/nginx/html"
    "/home/*/public_html"
)

for root in "${common_roots[@]}"; do
    if [ -d "$root" ]; then
        echo "✅ $root exists"
        echo "   Contents: $(ls -la $root 2>/dev/null | wc -l) items"
        
        # Check if qualia_nss exists here
        if [ -d "$root/qualia_nss" ]; then
            echo "   🎯 Found qualia_nss in $root"
        fi
    fi
done

echo ""
echo "=== Domain Configuration ==="
echo "Checking what's currently being served for www.qualia-nss.com..."

# Try to find where the current site files are
echo "Files in current web root:"
web_root=$(find /var/www /usr/share/nginx/html -name "index.html" 2>/dev/null | head -1 | xargs dirname)
if [ -n "$web_root" ]; then
    echo "Found web root: $web_root"
    ls -la "$web_root"
fi

echo ""
echo "💡 Next steps:"
echo "1. Find your project path using find_project_path.sh"  
echo "2. Update your web server config to point to /your/project/path/dist"
echo "3. Run deploy.sh in your project directory"