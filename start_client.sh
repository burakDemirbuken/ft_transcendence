#!/bin/bash

echo "🎮 Starting Pong Client Server"
echo "=============================="

# IP adresini al
SERVER_IP=$(hostname -I | awk '{print $1}')

PORT=3030

echo "📍 Server IP: $SERVER_IP"
echo "🌐 Client will be available at: http://$SERVER_IP:$PORT"
echo "🧪 Test page: http://$SERVER_IP:$PORT/test.html"
echo ""

# Client klasörüne git
cd "$(dirname "$0")/client"

echo "📂 Current directory: $(pwd)"
echo "📁 Files:"
ls -la

echo ""
echo "🚀 Starting HTTP server on port $PORT..."
echo "⏹️  Press Ctrl+C to stop"
echo ""

# HTTP sunucuyu başlat
python3 -m http.server $PORT
