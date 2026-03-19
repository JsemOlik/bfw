#!/bin/bash
set -e

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
