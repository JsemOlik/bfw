# Use ARGs to toggle between development and production
ARG APP_ENV=production

# --- Stage 1: PHP Base ---
FROM php:8.4-fpm-alpine AS base
WORKDIR /var/www/html

# Build-time dependencies
RUN apk add --no-cache --virtual .build-deps \
    postgresql-dev \
    libpng-dev \
    libzip-dev \
    libxml2-dev \
    icu-dev \
    $PHPIZE_DEPS \
    && docker-php-ext-install \
    pdo_pgsql \
    intl \
    zip \
    pcntl \
    opcache \
    && apk del .build-deps \
    && apk add --no-cache \
    postgresql-client \
    libpng \
    libzip \
    libxml2 \
    icu-libs \
    nginx \
    supervisor \
    bash \
    curl

# Create system user for Laravel
RUN set -x ; \
    addgroup -g 1000 -S www-data || true ; \
    adduser -u 1000 -D -S -G www-data www-data || true

# --- Stage 2: Unified Builder (Production Only) ---
FROM base AS builder

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash \
    && mv /root/.bun/bin/bun /usr/local/bin/bun

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy only dependency files for caching
COPY composer.json composer.lock package.json bun.lock ./

# Install all dependencies
RUN composer install --no-interaction --no-dev --optimize-autoloader --no-scripts
RUN bun install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Run production builds
# Note: wayfinder:generate will now work because 'vendor/' exists
RUN bun run build
RUN composer dump-autoload --optimize --no-dev

# --- Stage 3: Final Image ---
FROM base
ARG APP_ENV
ENV APP_ENV=${APP_ENV}

# Copy code and built assets from builder
COPY --from=builder --chown=www-data:www-data /var/www/html /var/www/html

# If dev, we might still want node_modules/vendor for first-time use if not mounted
# But for prod, we keep it clean.
RUN if [ "$APP_ENV" = "production" ]; then \
    rm -rf node_modules ; \
    fi

# Setup configs
COPY .docker/nginx.conf /etc/nginx/http.d/default.conf
COPY .docker/supervisord.conf /etc/supervisord.conf
COPY .docker/php.ini /usr/local/etc/php/conf.d/bfw-optimized.ini

# Fix permissions
RUN mkdir -p storage/framework/{sessions,views,cache} bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 80 5173

# Final permission and line-ending fix for entrypoint
RUN sed -i 's/\r$//' .docker/entrypoint.sh \
    && chmod +x .docker/entrypoint.sh

ENTRYPOINT [".docker/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
