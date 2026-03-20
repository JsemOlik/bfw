#!/bin/bash
set -e

CONTAINER_ROLE="${CONTAINER_ROLE:-app}"

# Ensure critical storage directories exist and are writable
mkdir -p storage/framework/{sessions,views,cache}
mkdir -p bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Prevent Vite from trying to use a dev server in production
rm -f public/hot

# Generate APP_KEY if it's missing from both environment and .env
if [ -z "$APP_KEY" ]; then
    if [ -f .env ]; then
        if ! grep -q "APP_KEY=base64:" .env || [ -z "$(grep "APP_KEY=" .env | cut -d'=' -f2)" ]; then
            echo "Generating application encryption key into .env..."
            php artisan key:generate --force
        fi
    else
        echo "WARNING: .env not found and APP_KEY not set in environment. Generating a temporary key for this session..."
        # We don't exit 1 anymore, we just warn.
        # But we should probably have a key for Laravel to boot.
        export APP_KEY=$(php artisan key:generate --show --force)
    fi
fi

if [ "$CACHE_STORE" = "redis" ] || [ "$SESSION_DRIVER" = "redis" ] || [ "$QUEUE_CONNECTION" = "redis" ]; then
    echo "Checking Redis connection..."
    until php -r '
        try {
            $redis = new Redis();
            $host = getenv("REDIS_HOST") ?: "redis";
            $port = (int) (getenv("REDIS_PORT") ?: 6379);
            $password = getenv("REDIS_PASSWORD");

            if (! $redis->connect($host, $port, 1.5)) {
                exit(1);
            }

            if ($password !== false && $password !== "" && strtolower((string) $password) !== "null") {
                if (! $redis->auth($password)) {
                    exit(1);
                }
            }

            $pong = $redis->ping();

            exit(($pong === true || $pong === "PONG" || $pong === "+PONG") ? 0 : 1);
        } catch (Throwable $exception) {
            exit(1);
        }
    '; do
        echo "Waiting for Redis (${REDIS_HOST:-redis}:${REDIS_PORT:-6379})..."
        sleep 1
    done
fi

# Run migrations if DB is up
echo "Checking database connection..."
if [ "$DB_CONNECTION" = "pgsql" ]; then
    until php -r "try { new PDO('pgsql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_DATABASE', '$DB_USERNAME', '$DB_PASSWORD'); } catch (Exception \$e) { exit(1); }"; do
        echo "Waiting for PostgreSQL ($DB_HOST:$DB_PORT)..."
        sleep 1
    done
fi

if [ "$CONTAINER_ROLE" = "app" ]; then
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
else
    echo "Skipping app-only boot tasks for role: $CONTAINER_ROLE"
fi

# Start the command (Supervisord)
exec "$@"
