import asyncio
import websockets
import json
import time

async def test_client(client_id, delay=0):
    """Tek bir test client'ı"""
    uri = "ws://localhost:3000"

    # Her client farklı test verisi göndersin
    test_game_data = {
        "ball": {
            "x": 600 + (client_id * 50),  # Her client farklı ball pozisyonu
            "y": 250 + (client_id * 30),
            "speed_x": 5 + client_id,
            "speed_y": -3 - client_id
        },
        "paddle": {
            "ai_y": 200 + (client_id * 20),
            "ai_speed_y": 0,
            "opponent_y": 300,
            "length": 80
        },
        "game_area": {
            "width": 800,
            "height": 600
        },
        "score": {
            "ai_score": client_id,
            "human_score": client_id + 1,
            "ai_scored": False,
            "human_scored": True
        },
        "ai_config": {
            "difficulty": "hard"
        }
    }

    try:
        # Bağlantı gecikmesi
        if delay > 0:
            await asyncio.sleep(delay)

        async with websockets.connect(uri) as websocket:
            print(f"Client {client_id}: Bağlandı!")

            # 5 mesaj gönder
            for i in range(5):
                # Mesaj gönder
                message = json.dumps(test_game_data)
                await websocket.send(message)
                print(f"Client {client_id}: Mesaj {i+1} gönderildi")

                # Cevabı bekle
                response = await websocket.recv()
                ai_decision = json.loads(response)
                print(f"Client {client_id}: AI cevabı {i+1}: {ai_decision['direction']}")

                # Kısa bekleme
                await asyncio.sleep(0.5)

            print(f"Client {client_id}: Tamamlandı!")

    except Exception as e:
        print(f"Client {client_id} Hatası: {e}")

async def test_multiple_clients():
    """Birden fazla client'ı aynı anda test et"""
    print("Çoklu client testi başlıyor...")

    # 3 client'ı aynı anda başlat
    tasks = []
    for i in range(3):
        task = test_client(client_id=i+1, delay=i*0.2)  # Küçük gecikme
        tasks.append(task)

    # Hepsini paralel çalıştır
    await asyncio.gather(*tasks)

    print("Tüm client'lar tamamlandı!")

if __name__ == "__main__":
    asyncio.run(test_multiple_clients())
