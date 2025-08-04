import asyncio
import websockets
import json

async def test_custom_websocket():
    uri = "ws://localhost:3000"

    # Custom AI ayarları (0-10 arası değerler)
    custom_ai_config = {
        "type": "init_game",
        "ai_config": {
            "difficulty": "custom",
            "custom_settings": {
                # Temel AI yetenekleri (0-10)
                "reaction_speed": 8,        # Yüksek tepki hızı
                "prediction_accuracy": 7,   # İyi tahmin doğruluğu
                "prepare_distance": 6,      # Orta hazırlık mesafesi
                "freeze_distance": 4,       # Düşük donma mesafesi
                "accuracy": 8,              # Yüksek doğruluk
                "learning_rate": 5,         # Orta öğrenme hızı

                # Oyun dengesi ayarları (0-10)
                "target_win_rate": 6,       # %60 kazanma hedefi
                "fairness": 7,              # Yüksek adalet (daha az kasten kaybetme)
                "max_consecutive_wins": 4,  # En fazla 4 ardışık kazanma

                # Özel özellikler (true/false)
                "rage_mode": True,          # Öfke modu aktif
                "fatigue_system": True,     # Yorgunluk sistemi aktif
                "focus_mode": True,         # Odaklanma modu aktif
                "adaptive_difficulty": True # Uyarlanabilir zorluk aktif
            }
        }
    }

    # Test oyun verileri - farklı senaryolar için
    test_scenarios = [
        {
            "name": "Normal Oyun",
            "data": {
                "type": "game_data",
                "ball": {"x": 400, "y": 300, "speed_x": 5, "speed_y": 3},
                "paddle": {"ai_y": 250, "ai_speed_y": 0, "opponent_y": 200, "length": 80},
                "game_area": {"width": 800, "height": 600},
                "score": {"ai_score": 1, "human_score": 1, "ai_scored": False, "human_scored": False}
            }
        },
        {
            "name": "AI Skor Yaptı (Rage Mode Test)",
            "data": {
                "type": "game_data",
                "ball": {"x": 200, "y": 300, "speed_x": -4, "speed_y": 2},
                "paddle": {"ai_y": 280, "ai_speed_y": 0, "opponent_y": 250, "length": 80},
                "game_area": {"width": 800, "height": 600},
                "score": {"ai_score": 2, "human_score": 1, "ai_scored": True, "human_scored": False}
            }
        },
        {
            "name": "İnsan Skor Yaptı (Rage Mode Tetikleme)",
            "data": {
                "type": "game_data",
                "ball": {"x": 600, "y": 200, "speed_x": 6, "speed_y": -4},
                "paddle": {"ai_y": 300, "ai_speed_y": 0, "opponent_y": 180, "length": 80},
                "game_area": {"width": 800, "height": 600},
                "score": {"ai_score": 1, "human_score": 3, "ai_scored": False, "human_scored": True}
            }
        },
        {
            "name": "Hızlı Top - AI'ya Yakın",
            "data": {
                "type": "game_data",
                "ball": {"x": 700, "y": 250, "speed_x": 8, "speed_y": -5},
                "paddle": {"ai_y": 200, "ai_speed_y": 0, "opponent_y": 300, "length": 80},
                "game_area": {"width": 800, "height": 600},
                "score": {"ai_score": 2, "human_score": 2, "ai_scored": False, "human_scored": False}
            }
        },
        {
            "name": "Yorgunluk Testi (Çok Oyun Sonrası)",
            "data": {
                "type": "game_data",
                "ball": {"x": 500, "y": 400, "speed_x": 4, "speed_y": 3},
                "paddle": {"ai_y": 350, "ai_speed_y": 0, "opponent_y": 320, "length": 80},
                "game_area": {"width": 800, "height": 600},
                "score": {"ai_score": 5, "human_score": 4, "ai_scored": False, "human_scored": False}
            }
        }
    ]

    try:
        async with websockets.connect(uri) as websocket:
            print("🎮 Custom AI WebSocket Testine Başlanıyor...")
            print("=" * 60)

            # 1. Oyunu başlat
            init_message = json.dumps(custom_ai_config)
            await websocket.send(init_message)
            print("📤 Custom AI ayarları gönderildi:")
            print(f"   Difficulty: custom")
            print(f"   Reaction Speed: {custom_ai_config['ai_config']['custom_settings']['reaction_speed']}/10")
            print(f"   Accuracy: {custom_ai_config['ai_config']['custom_settings']['accuracy']}/10")
            print(f"   Rage Mode: {custom_ai_config['ai_config']['custom_settings']['rage_mode']}")
            print(f"   Fatigue System: {custom_ai_config['ai_config']['custom_settings']['fatigue_system']}")
            print(f"   Focus Mode: {custom_ai_config['ai_config']['custom_settings']['focus_mode']}")

            # Oyun başlatma cevabını bekle
            init_response = await websocket.recv()
            print(f"📥 Oyun başlatma cevabı: {init_response}")

            init_result = json.loads(init_response)
            if not init_result.get('success', False):
                print("❌ Oyun başlatılamadı!")
                return

            game_id = init_result.get('game_id', 'Unknown')
            print(f"✅ Oyun başlatıldı! Game ID: {game_id}")
            print("=" * 60)

            # 2. Test senaryolarını çalıştır
            for i, scenario in enumerate(test_scenarios, 1):
                print(f"\n🎯 Test {i}: {scenario['name']}")
                print("-" * 40)

                # Oyun verisini gönder
                game_message = json.dumps(scenario['data'])
                await websocket.send(game_message)

                # Kısa bilgi yazdır
                ball_data = scenario['data']['ball']
                score_data = scenario['data']['score']
                print(f"   Top Pozisyonu: ({ball_data['x']}, {ball_data['y']})")
                print(f"   Top Hızı: ({ball_data['speed_x']}, {ball_data['speed_y']})")
                print(f"   Skor: AI {score_data['ai_score']} - {score_data['human_score']} İnsan")

                if score_data['ai_scored']:
                    print("   🔥 AI skor yaptı!")
                elif score_data['human_scored']:
                    print("   😤 İnsan skor yaptı! (AI öfkelenebilir)")

                # AI cevabını bekle
                game_response = await websocket.recv()
                print(f"   📥 AI Cevabı: {game_response}")

                # Cevabı analiz et
                try:
                    ai_decision = json.loads(game_response)
                    if 'direction' in ai_decision:
                        direction = ai_decision['direction']
                        direction_emoji = {"up": "⬆️", "down": "⬇️", "stable": "➡️"}.get(direction, "❓")
                        print(f"   🤖 AI Kararı: {direction} {direction_emoji}")
                    elif 'error' in ai_decision:
                        print(f"   ❌ Hata: {ai_decision['error']}")
                except json.JSONDecodeError:
                    print(f"   ❌ JSON parse hatası!")

                # Testler arası kısa bekleme
                await asyncio.sleep(0.5)

            print("\n" + "=" * 60)
            print("✅ Tüm testler tamamlandı!")

    except Exception as e:
        print(f"❌ Hata: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_custom_websocket())
