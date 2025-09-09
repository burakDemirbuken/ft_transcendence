# test_new_client.py
import asyncio
import websockets
import json

async def test_new_protocol():
    uri = "ws://localhost:3000"

    async with websockets.connect(uri) as websocket:
        # 1. Oyun başlat
        init_message = {
            "type": "init_game",
            "game_id": "test_game_123",
            "ai_config": {
                "difficulty": "hard"
            }
        }

        await websocket.send(json.dumps(init_message))
        response = await websocket.recv()
        print(f"Init response: {response}")

        # 2. Normal oyun verileri gönder
        for i in range(5):
            game_data = {
                "type": "game_data",
                "ball": {"x": 600 + i*10, "y": 250, "speed_x": 5, "speed_y": -3},
                "paddle": {"ai_y": 200, "length": 80},
                "score": {"ai_scored": False, "human_scored": True}
            }

            await websocket.send(json.dumps(game_data))
            response = await websocket.recv()
            ai_decision = json.loads(response)
            print(f"Move {i+1}: {ai_decision['direction']}")

            await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(test_new_protocol())
