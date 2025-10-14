#!/bin/sh

if [ ! -f /etc/nginx/ssl/localhost.crt ] || [ ! -f /etc/nginx/ssl/localhost.key ]; then
    echo "Generating SSL certificates..."

    openssl genrsa -out /etc/nginx/ssl/localhost.key 4096

    openssl req -new -x509 -key /etc/nginx/ssl/localhost.key \
        -out /etc/nginx/ssl/localhost.crt -days 365 \
        -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Transcendence/OU=IT/CN=localhost"

    chmod 755 /etc/nginx/ssl/localhost.key
    chmod 755 /etc/nginx/ssl/localhost.crt

    echo "SSL certificates generated successfully!"
else
    echo "SSL certificates already exist, skipping generation."
fi

echo "SSL configuration file created!"

echo "Starting nginx..."

echo "Setting correct permissions for web files..."
chown -R nginx:nginx /usr/share/nginx/html
find /usr/share/nginx/html -type d -exec chmod 755 {} \;
find /usr/share/nginx/html -type f -exec chmod 644 {} \;

exec "$@"
