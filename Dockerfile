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