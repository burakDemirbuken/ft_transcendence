import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:3000"

    # Önce oyun başlatma verisi
    init_game_data = {
        "type": "init_game",
        "ai_config": {
            "difficulty": "hard"
        }
    }

    # Test verisi - oyun durumunu simüle eder
    test_game_data = {
        "type": "game_data",
        "ball": {
            "x": 600,
            "y": 250,
            "speed_x": 5,
            "speed_y": -3
        },
        "paddle": {
            "ai_y": 200,
            "ai_speed_y": 0,
            "opponent_y": 300,
            "length": 80
        },
        "game_area": {
            "width": 800,
            "height": 600
        },
        "score": {
            "ai_score": 2,
            "human_score": 3,
            "ai_scored": False,
            "human_scored": True
        }
    }

    try:
        async with websockets.connect(uri) as websocket:
            print("WebSocket sunucusuna bağlandı!")

            # 1. Önce oyunu başlat
            init_message = json.dumps(init_game_data)
            await websocket.send(init_message)
            print(f"Oyun başlatma verisi gönderildi: {init_message}")

            # Oyun başlatma cevabını bekle
            init_response = await websocket.recv()
            print(f"Oyun başlatma cevabı: {init_response}")

            init_result = json.loads(init_response)
            if not init_result.get('success', False):
                print("Oyun başlatılamadı!")
                return

            # 2. Şimdi oyun verilerini gönder
            game_message = json.dumps(test_game_data)
            await websocket.send(game_message)
            print(f"Oyun verisi gönderildi: {game_message}")

            # AI kararını bekle
            game_response = await websocket.recv()
            print(f"AI cevabı alındı: {game_response}")

            # JSON'u parse et
            ai_decision = json.loads(game_response)
            if 'direction' in ai_decision:
                print(f"AI kararı: {ai_decision['direction']}")
            else:
                print(f"Hata: {ai_decision.get('error', 'Bilinmeyen hata')}")

    except Exception as e:
        print(f"Hata: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
