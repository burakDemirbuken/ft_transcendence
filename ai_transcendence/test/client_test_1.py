import asyncio
import websockets
import json
import time

async def test_websocket():
    uri = "ws://localhost:3000"

    # Oyun alanı boyutları (sabit)
    game_width = 800
    game_height = 600

    # Oyun başlatma verisi
    init_game_data = {
        "type": "init_game",
        "ai_config": {
            "difficulty": "hard"
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
            game_id = init_result.get('game_id', 'bilinmeyen')
            print(f"Oyun ID: {game_id}")

            if 'error' in init_result:
                print(f"Oyun başlatılamadı: {init_result['error']}")
                return

            # 2. Farklı durumlar için AI kararlarını test et
            test_scenarios = [
                # Senaryo 1: Normal paddle yüksekliği (80px)
                {
                    "description": "Normal paddle yüksekliği (80px)",
                    "ball": {"x": 600, "y": 300, "speed_x": -5, "speed_y": -3},
                    "paddle": {"ai_y": 300, "height": 80}
                },

                # Senaryo 2: Uzun paddle (120px)
                {
                    "description": "Uzun paddle (120px)",
                    "ball": {"x": 700, "y": 100, "speed_x": -8, "speed_y": 2},
                    "paddle": {"ai_y": 300, "height": 120}
                },

                # Senaryo 3: Kısa paddle (50px)
                {
                    "description": "Kısa paddle (50px)",
                    "ball": {"x": 650, "y": 500, "speed_x": -6, "speed_y": -4},
                    "paddle": {"ai_y": 300, "height": 50}
                },

                # Senaryo 4: Top üstte, paddle üstte
                {
                    "description": "Top üstte, paddle üstte",
                    "ball": {"x": 700, "y": 100, "speed_x": -7, "speed_y": -2},
                    "paddle": {"ai_y": 100, "height": 80}
                },

                # Senaryo 5: Top altta, paddle altta
                {
                    "description": "Top altta, paddle altta",
                    "ball": {"x": 700, "y": 500, "speed_x": -10, "speed_y": 5},
                    "paddle": {"ai_y": 500, "height": 80}
                },

                # Senaryo 6: Çok uzun paddle (200px)
                {
                    "description": "Çok uzun paddle (200px)",
                    "ball": {"x": 600, "y": 300, "speed_x": -5, "speed_y": 0},
                    "paddle": {"ai_y": 300, "height": 200}
                },

                # Senaryo 7: Çok kısa paddle (30px)
                {
                    "description": "Çok kısa paddle (30px)",
                    "ball": {"x": 600, "y": 300, "speed_x": -5, "speed_y": 0},
                    "paddle": {"ai_y": 300, "height": 30}
                },

                # Senaryo 8: AI skor kazandı
                {
                    "description": "AI skor kazandı",
                    "ball": {"x": 400, "y": 300, "speed_x": -5, "speed_y": 2},
                    "paddle": {"ai_y": 300, "height": 80},
                    "scored_for_me": True
                },

                # Senaryo 9: AI skor kaybetti
                {
                    "description": "AI skor kaybetti",
                    "ball": {"x": 400, "y": 300, "speed_x": -5, "speed_y": 2},
                    "paddle": {"ai_y": 300, "height": 80},
                    "scored_against_me": True
                }
            ]

            for i, scenario in enumerate(test_scenarios):
                print(f"\n--- Test Senaryosu {i+1}: {scenario['description']} ---")

                # Paddle yüksekliğini al
                paddle_height = scenario["paddle"]["height"]
                paddle_y = scenario["paddle"]["ai_y"]

                # Paddle konumunun sınırlar içinde olduğunu kontrol et
                min_paddle_y = paddle_height // 2
                max_paddle_y = game_height - (paddle_height // 2)

                if paddle_y < min_paddle_y:
                    print(f"Uyarı: Paddle konumu çok yukarıda, {min_paddle_y} olarak düzeltildi")
                    scenario["paddle"]["ai_y"] = min_paddle_y
                elif paddle_y > max_paddle_y:
                    print(f"Uyarı: Paddle konumu çok aşağıda, {max_paddle_y} olarak düzeltildi")
                    scenario["paddle"]["ai_y"] = max_paddle_y

                # Test verisini oluştur
                current_data = {
                    "type": "game_data",
                    "ball": scenario["ball"],
                    "paddle": scenario["paddle"],
                    "game_area": {
                        "width": game_width,
                        "height": game_height
                    }
                }

                # Ek parametreleri ekle
                for key, value in scenario.items():
                    if key not in ["description", "ball", "paddle"]:
                        current_data[key] = value

                # Veriyi gönder
                game_message = json.dumps(current_data)
                print(f"Gönderilen veri: {game_message}")
                await websocket.send(game_message)

                # AI kararını bekle
                game_response = await websocket.recv()
                ai_decision = json.loads(game_response)
                print(f"AI cevabı: {game_response}")

                if 'target_y' in ai_decision:
                    print(f"AI hedef Y: {ai_decision['target_y']}")

                    # Paddle'ın mevcut konumu ile hedef konum arasındaki farkı göster
                    current_paddle_y = scenario["paddle"]["ai_y"]
                    target_y = ai_decision['target_y']
                    diff = target_y - current_paddle_y

                    if abs(diff) < 5:
                        move_direction = "sabit kalıyor"
                    elif diff < 0:
                        move_direction = "yukarı hareket ediyor"
                    else:
                        move_direction = "aşağı hareket ediyor"

                    print(f"Paddle {current_paddle_y} konumundan {target_y} konumuna {move_direction} (Fark: {diff:.1f})")

                    # Hedef konumun sınırlar içinde olup olmadığını kontrol et
                    if target_y < min_paddle_y:
                        print(f"Uyarı: AI hedefi sınırın dışında (çok yukarıda): {target_y} < {min_paddle_y}")
                    elif target_y > max_paddle_y:
                        print(f"Uyarı: AI hedefi sınırın dışında (çok aşağıda): {target_y} > {max_paddle_y}")

                elif 'error' in ai_decision:
                    print(f"Hata: {ai_decision['error']}")

                # Kısa bir bekleme ekle
                await asyncio.sleep(1)

    except Exception as e:
        print(f"Hata: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_websocket())
