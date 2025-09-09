FROM python:3.11-slim

WORKDIR /app

COPY . .

# Gerekli kütüphaneleri yükle
RUN pip install --no-cache-dir -r requirements.txt

# WebSocket sunucusunu başlat
CMD ["python", "main.py", "--websocket"]
