#!/bin/bash
set -e

# Ensure critical storage directories exist and are writable
mkdir -p storage/framework/{sessions,views,cache}
mkdir -p bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Generate APP_KEY if it's missing or empty in .env
if [ -f .env ]; then
    if ! grep -q "APP_KEY=base64:" .env || [ -z "$(grep "APP_KEY=" .env | cut -d'=' -f2)" ]; then
        echo "Generating application encryption key..."
        php artisan key:generate --force
    fi
else
    echo ".env file not found. Please ensure it exists."
    exit 1
fi

# Run migrations if DB is up
echo "Checking database connection..."
if [ "$DB_CONNECTION" = "pgsql" ]; then
    until php -r "try { new PDO('pgsql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_DATABASE', '$DB_USERNAME', '$DB_PASSWORD'); } catch (Exception \$e) { exit(1); }"; do
        echo "Waiting for PostgreSQL ($DB_HOST:$DB_PORT)..."
        sleep 1
    done
fi

php artisan migrate --force

# Clear stale caches (Must happen AFTER migrations if using 'database' driver)
echo "Clearing application caches..."
if [ "$APP_ENV" = "production" ]; then
    echo "Running production optimizations..."
    php artisan optimize
else
    php artisan optimize:clear
fi

# Generate Wayfinder actions/routes
# In dev, we always want new ones. In prod, they should be baked, but a refresh doesn't hurt.
echo "Generating Wayfinder types..."
php artisan wayfinder:generate --with-form

# Start the command (Supervisord)
exec "$@"
