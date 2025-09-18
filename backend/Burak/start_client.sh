#!/bin/bash

echo "🎮 Starting Pong Client Server"
echo "=============================="

# IP adresini al (macOS ve Linux uyumlu)
detect_ip() {
    if command -v hostname >/dev/null 2>&1; then
        # Linux'ta hostname -I mevcut, macOS'ta değil
        if hostname -I >/dev/null 2>&1; then
            hostname -I | awk '{print $1}'
            return
        fi
    fi

    # macOS: Wi-Fi arayüzleri için dene
    if command -v ipconfig >/dev/null 2>&1; then
        for iface in en0 en1 en2; do
            ip=$(ipconfig getifaddr "$iface" 2>/dev/null)
            if [ -n "$ip" ]; then
                echo "$ip"
                return
            fi
        done
        # loopback'e düş
        ip=$(ipconfig getifaddr lo0 2>/dev/null)
        if [ -n "$ip" ]; then
            echo "$ip"
            return
        fi
    fi

    # Son çare
    echo "127.0.0.1"
}

SERVER_IP=$(detect_ip)

PORT=3030

# Port meşgulse uygun bir port bul
find_free_port() {
    local port=$1
    while lsof -i :"$port" -sTCP:LISTEN >/dev/null 2>&1; do
        port=$((port+1))
    done
    echo "$port"
}

PORT=$(find_free_port "$PORT")

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

# HTTP sunucuyu başlat (tüm arayüzlere bağlan)
python3 -m http.server "$PORT" --bind 0.0.0.0
