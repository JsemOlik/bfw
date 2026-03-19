#!/bin/bash
set -e

# Ensure critical storage directories exist and are writable
mkdir -p storage/framework/{sessions,views,cache}
mkdir -p bootstrap/cache
chmod -R 777 storage bootstrap/cache

# Clear any stale caches that might cause path issues (common on Windows mounts)
php artisan view:clear
php artisan config:clear
php artisan cache:clear

# Install PHP dependencies
composer install --no-interaction

# Install JS dependencies
bun install

# Run migrations
php artisan migrate --force

# Start Laravel Dev Server in background
php artisan serve --host=0.0.0.0 --port=8000 &

# Start Vite Dev Server
bun dev --host=0.0.0.0
