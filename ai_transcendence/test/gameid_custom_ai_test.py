# test_custom_ai.py
import asyncio
import websockets
import json

async def test_custom_ai():
    """Custom AI ayarlarını test et"""
    print("⚙️ Custom AI Testi...")

    custom_settings = {
        'reaction_speed': 8,        # 10 üzerinden
        'prediction_accuracy': 9,   # 10 üzerinden
        'prepare_distance': 7,      # 10 üzerinden
        'freeze_distance': 6,       # 10 üzerinden
        'accuracy': 8,              # 10 üzerinden
        'learning_rate': 5,         # 10 üzerinden
        'target_win_rate': 7,       # 10 üzerinden
        'fairness': 6,              # 10 üzerinden
        'max_consecutive_wins': 3,
        'rage_mode': True,
        'fatigue_system': True,
        'focus_mode': True,
        'adaptive_difficulty': True,
        'show_prediction': True
    }

    async with websockets.connect("ws://localhost:3000") as ws:
        # Custom AI ile oyun başlat
        init_msg = {
            "type": "init_game",
            "ai_config": {
                "difficulty": "custom",
                "custom_settings": custom_settings
            }
        }

        await ws.send(json.dumps(init_msg))
        response = await ws.recv()
        data = json.loads(response)

        print(f"✅ Custom AI oyunu başlatıldı: {data.get('game_id')}")

        # Test verileri gönder
        for i in range(5):
            game_data = {
                "type": "game_data",
                "game_id": data.get('game_id'),
                "ball": {"x": 600 + i*20, "y": 300 + i*30, "speed_x": -5, "speed_y": 3},
                "paddle": {"ai_y": 250, "height": 80},
                "game_area": {"width": 800, "height": 600},
                "scored_for_me": i == 2,  # 3. frame'de AI skor kazansın
                "scored_against_me": i == 4  # 5. frame'de AI skor kaybetsin
            }

            await ws.send(json.dumps(game_data))
            ai_response = await ws.recv()
            ai_data = json.loads(ai_response)

            print(f"Frame {i+1}: AI hedef = {ai_data.get('target_y', 0):.1f}")
            await asyncio.sleep(0.2)

if __name__ == "__main__":
    asyncio.run(test_custom_ai())
