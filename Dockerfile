# Stage 0: Pre-install frontend dependencies
FROM oven/bun:alpine AS frontend
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
# No build here because Wayfinder requires PHP which isn't in this image

# Stage 1: Build the final PHP application
FROM php:8.4-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-dev \
    libzip-dev \
    icu-dev \
    bash \
    curl \
    git \
    unzip \
    nodejs \
    npm

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_pgsql \
    intl \
    zip \
    pcntl

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Bun (for those who need it in development)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Set workspace
WORKDIR /var/www/html

# Copy application code
COPY . .

# Copy pre-installed node_modules to speed up first start
COPY --from=frontend /app/node_modules ./node_modules

# Pre-install Composer dependencies
RUN composer install --no-interaction --optimize-autoloader

# Setup Nginx and Supervisord configs
COPY .docker/nginx.conf /etc/nginx/http.d/default.conf
COPY .docker/supervisord.conf /etc/supervisord.conf

# Expose ports
EXPOSE 80 5173

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Entrypoint
RUN chmod +x .docker/entrypoint.sh
ENTRYPOINT [".docker/entrypoint.sh"]

# Start Supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
