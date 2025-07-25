import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:3000"

    # Test verisi - oyun durumunu simüle eder
    test_game_data = {
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
        },
        "ai_config": {
            "difficulty": "hard"
        }
    }

    try:
        async with websockets.connect(uri) as websocket:
            print("WebSocket sunucusuna bağlandı!")

            # Test verilerini gönder
            message = json.dumps(test_game_data)
            await websocket.send(message)
            print(f"Veri gönderildi: {message}")

            # Cevabı bekle
            response = await websocket.recv()
            print(f"AI cevabı alındı: {response}")

            # JSON'u parse et
            ai_decision = json.loads(response)
            print(f"AI kararı: {ai_decision['direction']}")

    except Exception as e:
        print(f"Hata: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
