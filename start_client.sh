#!/bin/bash

echo "🎮 Starting Pong Client Server"
echo "=============================="

# IP adresini al
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "📍 Server IP: $SERVER_IP"
echo "🌐 Client will be available at: http://$SERVER_IP:8080"
echo "🧪 Test page: http://$SERVER_IP:8080/test.html"
echo ""

# Client klasörüne git
cd "$(dirname "$0")/client"

echo "📂 Current directory: $(pwd)"
echo "📁 Files:"
ls -la

echo ""
echo "🚀 Starting HTTP server on port 8080..."
echo "⏹️  Press Ctrl+C to stop"
echo ""

# HTTP sunucuyu başlat
python3 -m http.server 3030
