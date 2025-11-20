#!/bin/sh

if [ ! -f /etc/nginx/ssl/certificate.crt ] || [ ! -f /etc/nginx/ssl/certificate.key ]; then
    echo "Generating SSL certificates..."

    if [ -z "$SSL_EXTERNAL_IP" ]; then
        SSL_EXTERNAL_IP=127.0.0.1
    fi
    echo "Using IP: $SSL_EXTERNAL_IP"
    openssl genrsa -out /etc/nginx/ssl/certificate.key 4096

    openssl req -new -x509 -key /etc/nginx/ssl/certificate.key \
        -out /etc/nginx/ssl/certificate.crt -days 365 \
        -subj "/C=TR/ST=Kocaeli/L=Gebze/O=42 Kocaeli/OU=ft_transcendence/CN=${SSL_EXTERNAL_IP}"

    chmod 600 /etc/nginx/ssl/certificate.key
    chmod 644 /etc/nginx/ssl/certificate.crt

    echo "SSL certificates generated successfully!"
    echo "Certificate valid for: ${SSL_EXTERNAL_IP}"
else
    echo "SSL certificates already exist, skipping generation."
fi

echo "Server configured for IP: ${SSL_EXTERNAL_IP}"
echo "Starting nginx..."
exec "$@"
