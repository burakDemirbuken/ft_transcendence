import asyncio
import websockets
import json

async def test_extreme_custom_ai():
    """Ekstrem custom ayarlarla test"""
    uri = "ws://localhost:3000"

    # Ekstrem AI ayarları - Çok güçlü AI
    extreme_config = {
        "type": "init_game",
        "ai_config": {
            "difficulty": "custom",
            "custom_settings": {
                "reaction_speed": 10,       # Maksimum tepki hızı
                "prediction_accuracy": 10,  # Mükemmel tahmin
                "prepare_distance": 10,     # Maksimum hazırlık mesafesi
                "freeze_distance": 8,       # Yüksek donma mesafesi
                "accuracy": 10,             # Mükemmel doğruluk
                "learning_rate": 8,         # Hızlı öğrenme
                "target_win_rate": 9,       # %90 kazanma hedefi
                "fairness": 2,              # Düşük adalet (çok kasten kaybetme)
                "max_consecutive_wins": 10, # Çok ardışık kazanma
                "rage_mode": True,
                "fatigue_system": False,    # Yorulmaz
                "focus_mode": True,
                "adaptive_difficulty": False
            }
        }
    }

    # Kolay AI ayarları
    easy_config = {
        "type": "init_game",
        "ai_config": {
            "difficulty": "custom",
            "custom_settings": {
                "reaction_speed": 2,        # Çok yavaş tepki
                "prediction_accuracy": 3,   # Kötü tahmin
                "prepare_distance": 2,      # Kısa hazırlık
                "freeze_distance": 1,       # Çok az donma
                "accuracy": 2,              # Düşük doğruluk
                "learning_rate": 1,         # Yavaş öğrenme
                "target_win_rate": 3,       # %30 kazanma hedefi
                "fairness": 9,              # Yüksek adalet
                "max_consecutive_wins": 1,  # Sadece 1 ardışık kazanma
                "rage_mode": False,
                "fatigue_system": True,     # Çabuk yorulur
                "focus_mode": False,
                "adaptive_difficulty": True
            }
        }
    }

    configs = [
        ("🔥 EKSTREM GÜÇLÜ AI", extreme_config),
        ("😊 ÇOK KOLAY AI", easy_config)
    ]

    for config_name, config in configs:
        print(f"\n{config_name}")
        print("=" * 50)

        try:
            async with websockets.connect(uri) as websocket:
                # AI'ı başlat
                await websocket.send(json.dumps(config))
                init_response = await websocket.recv()
                init_result = json.loads(init_response)

                if not init_result.get('success', False):
                    print("❌ Oyun başlatılamadı!")
                    continue

                print(f"✅ {config_name} başlatıldı!")

                # Test verisi
                test_data = {
                    "type": "game_data",
                    "ball": {"x": 650, "y": 300, "speed_x": 7, "speed_y": -4},
                    "paddle": {"ai_y": 250, "ai_speed_y": 0, "opponent_y": 200, "length": 80},
                    "game_area": {"width": 800, "height": 600},
                    "score": {"ai_score": 0, "human_score": 0, "ai_scored": False, "human_scored": False}
                }

                # 5 kez test et
                for i in range(5):
                    await websocket.send(json.dumps(test_data))
                    response = await websocket.recv()

                    try:
                        ai_decision = json.loads(response)
                        direction = ai_decision.get('direction', 'error')
                        print(f"   Test {i+1}: {direction}")
                    except:
                        print(f"   Test {i+1}: Hata")

                    await asyncio.sleep(0.2)

        except Exception as e:
            print(f"❌ Hata: {e}")

if __name__ == "__main__":
    asyncio.run(test_extreme_custom_ai())
