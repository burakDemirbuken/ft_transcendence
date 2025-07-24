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

# Create SSL configuration file
cat > /etc/nginx/ssl/ssl.conf << 'EOF'
# SSL Settings
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# Modern SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA;
ssl_prefer_server_ciphers on;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;

# Security headers (can be overridden in server blocks)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
EOF

echo "SSL configuration file created!"

# Start nginx
echo "Starting nginx..."
exec "$@"
echo "Starting nginx..."
exec nginx -g "daemon off;"