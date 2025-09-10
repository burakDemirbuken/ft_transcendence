import asyncio
import websockets
import json
import time

async def test_websocket():
    uri = "ws://localhost:3000"

    # Oyun başlatma verisi
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
            "height": 80,
            "ai_speed_y": 0,
            "opponent_y": 300
        },
        "game_area": {
            "width": 800,
            "height": 600
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
                # Normal durum
                {"ball": {"x": 600, "y": 250, "speed_x": 5, "speed_y": -3}},

                # Top hızla yaklaşıyor
                {"ball": {"x": 700, "y": 300, "speed_x": 10, "speed_y": 5}},

                # Top uzakta
                {"ball": {"x": 100, "y": 400, "speed_x": 3, "speed_y": -2}},

                # AI skor kazandı
                {"ball": {"x": 400, "y": 200, "speed_x": -5, "speed_y": 2}, "scored_for_me": True},

                # AI skor kaybetti
                {"ball": {"x": 400, "y": 200, "speed_x": -5, "speed_y": 2}, "scored_against_me": True},

                # Çok hızlı top
                {"ball": {"x": 650, "y": 150, "speed_x": 15, "speed_y": 8}}
            ]

            for i, scenario in enumerate(test_scenarios):
                print(f"\n--- Test Senaryosu {i+1} ---")

                # Temel veriyi kopyala ve senaryo değişikliklerini uygula
                current_data = test_game_data.copy()
                current_data["ball"].update(scenario.get("ball", {}))

                # Ek parametreleri ekle
                for key, value in scenario.items():
                    if key != "ball":
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
