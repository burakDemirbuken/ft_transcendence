# test_multiple_games.py
import asyncio
import websockets
import json

async def test_multiple_games():
    """Aynı anda birden fazla oyun test et"""
    print("🎮 Çoklu Oyun Testi Başlıyor...")

    async def create_game(game_name, difficulty):
        try:
            async with websockets.connect("ws://localhost:3000") as ws:
                # Oyun başlat
                init_msg = {
                    "type": "init_game",
                    "ai_config": {"difficulty": difficulty}
                }
                await ws.send(json.dumps(init_msg))

                response = await ws.recv()
                data = json.loads(response)
                game_id = data.get("game_id")

                print(f"✅ {game_name} başlatıldı (ID: {game_id}, Zorluk: {difficulty})")

                # Birkaç oyun verisi gönder
                for i in range(3):
                    game_data = {
                        "type": "game_data",
                        "game_id": game_id,
                        "ball": {"x": 400 + i*50, "y": 300, "speed_x": 5, "speed_y": 2},
                        "paddle": {"ai_y": 250, "height": 80},
                        "game_area": {"width": 800, "height": 600}
                    }

                    await ws.send(json.dumps(game_data))
                    ai_response = await ws.recv()
                    ai_data = json.loads(ai_response)

                    print(f"  {game_name} Frame {i+1}: AI hedef = {ai_data.get('target_y', 0):.1f}")
                    await asyncio.sleep(0.1)

        except Exception as e:
            print(f"❌ {game_name} hatası: {e}")

    # Aynı anda 3 farklı oyun başlat
    tasks = [
        create_game("Oyun-1", "easy"),
        create_game("Oyun-2", "medium"),
        create_game("Oyun-3", "hard")
    ]

    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(test_multiple_games())
