#!/bin/sh

# Check if SSL certificates already exist
if [ ! -f /etc/nginx/ssl/localhost.crt ] || [ ! -f /etc/nginx/ssl/localhost.key ]; then
    echo "Generating SSL certificates..."
    
    # Generate private key
    openssl genrsa -out /etc/nginx/ssl/localhost.key 2048
    
    # Generate certificate signing request and self-signed certificate
    openssl req -new -x509 -key /etc/nginx/ssl/localhost.key -out /etc/nginx/ssl/localhost.crt -days 365 -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Transcendence/OU=IT/CN=localhost.com"
    
    # Set proper permissions
    chmod 600 /etc/nginx/ssl/localhost.key
    chmod 644 /etc/nginx/ssl/localhost.crt
    
    echo "SSL certificates generated successfully!"
else
    echo "SSL certificates already exist, skipping generation."
fi

echo "SSL configuration file created!"

# Start nginx
echo "Starting nginx..."
exec "$@"
echo "Starting nginx..."
exec nginx -g "daemon off;"