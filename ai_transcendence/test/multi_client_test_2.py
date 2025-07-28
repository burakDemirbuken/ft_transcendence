import asyncio
import websockets
import json
import time

async def test_client(client_name: str, game_id: str, ai_config: dict, test_duration: int = 10):
    """Tek bir client testi"""
    uri = "ws://localhost:3000"

    try:
        async with websockets.connect(uri) as websocket:
            print(f"🔗 {client_name} bağlandı!")

            # 1. Oyun başlatma
            init_message = {
                "type": "init_game",
                "game_id": game_id,
                "ai_config": ai_config
            }

            await websocket.send(json.dumps(init_message))
            response = await websocket.recv()
            init_result = json.loads(response)

            if init_result.get("success"):
                print(f"✅ {client_name}: Oyun başlatıldı (ID: {init_result['game_id']})")
                difficulty = init_result.get('ai_difficulty', 'unknown')
                print(f"   Zorluk: {difficulty}")
            else:
                print(f"❌ {client_name}: Oyun başlatılamadı - {init_result.get('error')}")
                return

            # 2. Test verileri
            moves_count = 0
            directions_count = {"up": 0, "down": 0, "stable": 0}

            # Test süresi boyunca oyun verisi gönder
            start_time = time.time()

            while time.time() - start_time < test_duration:
                # Dinamik test verisi oluştur
                elapsed = time.time() - start_time

                game_data = {
                    "type": "game_data",
                    "ball": {
                        "x": 400 + int(200 * (elapsed % 2)),  # Sağa sola hareket
                        "y": 300 + int(100 * ((elapsed % 4) - 2)),  # Yukarı aşağı
                        "speed_x": 5 + int(elapsed % 3),
                        "speed_y": -3 + int(elapsed % 6) - 3
                    },
                    "paddle": {
                        "ai_y": 250 + int(50 * (elapsed % 3)),
                        "opponent_y": 300,
                        "length": 80
                    },
                    "game_area": {
                        "width": 800,
                        "height": 600
                    },
                    "score": {
                        "ai_score": int(elapsed / 3),
                        "human_score": int(elapsed / 4),
                        "ai_scored": (elapsed % 5) < 1,
                        "human_scored": (elapsed % 7) < 1
                    }
                }

                # Veri gönder
                await websocket.send(json.dumps(game_data))

                # Cevap al
                response = await websocket.recv()
                ai_response = json.loads(response)

                if "direction" in ai_response:
                    direction = ai_response["direction"]
                    directions_count[direction] += 1
                    moves_count += 1

                    if moves_count % 20 == 0:  # Her 20 harekette bir rapor
                        print(f"📊 {client_name}: {moves_count} hamle - "
                              f"Up: {directions_count['up']}, "
                              f"Down: {directions_count['down']}, "
                              f"Stable: {directions_count['stable']}")
                else:
                    print(f"⚠️ {client_name}: Hatalı cevap - {ai_response}")

                # Kısa bekleme
                await asyncio.sleep(0.1)

            # Final raporu
            total_time = time.time() - start_time
            print(f"🏁 {client_name} tamamlandı!")
            print(f"   Süre: {total_time:.1f}s")
            print(f"   Toplam hamle: {moves_count}")
            print(f"   Hamle/saniye: {moves_count/total_time:.1f}")
            if moves_count > 0:
                print(f"   Up: {directions_count['up']} (%{directions_count['up']/moves_count*100:.1f})")
                print(f"   Down: {directions_count['down']} (%{directions_count['down']/moves_count*100:.1f})")
                print(f"   Stable: {directions_count['stable']} (%{directions_count['stable']/moves_count*100:.1f})")
            print()

    except Exception as e:
        print(f"❌ {client_name} Hatası: {e}")
        import traceback
        traceback.print_exc()

async def run_simultaneous_multi_level_test():
    """Tüm seviyeleri aynı anda başlat"""
    print("🚀 AYNI ANDA ÇOKLU SEVİYE AI TESTİ BAŞLIYOR...")
    print("=" * 60)

    # Test konfigürasyonları - DÜZELTİLMİŞ ÖZEL AI
    test_configs = [
        {
            "client_name": "🟢 KOLAY AI",
            "game_id": "easy_game",
            "ai_config": {"difficulty": "easy"},
            "duration": 15
        },
        {
            "client_name": "🟡 ORTA AI",
            "game_id": "medium_game",
            "ai_config": {"difficulty": "medium"},
            "duration": 15
        },
        {
            "client_name": "🔴 ZOR AI",
            "game_id": "hard_game",
            "ai_config": {"difficulty": "hard"},
            "duration": 15
        },
        {
            "client_name": "💀 İMKANSIZ AI",
            "game_id": "impossible_game",
            "ai_config": {"difficulty": "impossible"},
            "duration": 15
        },
        {
            "client_name": "⚙️ ÖZEL AI",
            "game_id": "custom_game",
            "ai_config": {
                "difficulty": "custom",
                "custom_settings": {
                    # AI_PLAYER.PY'DEKİ PARAMETRELERLE EŞLEŞTİRİLDİ
                    "reaction_speed": 9.5,          # 0-10 arası (ai_player.py'de /10 yapılıyor)
                    "prediction_accuracy": 9.0,     # 0-10 arası (ai_player.py'de /10 yapılıyor)
                    "prepare_distance": 8,          # 0-10 arası (ai_player.py'de 200+x*40)
                    "freeze_distance": 7,           # 0-10 arası (ai_player.py'de 50+x*15)
                    "accuracy": 9,                  # 0-10 arası (ai_player.py'de error_rate hesabı)
                    "learning_rate": 6,             # 0-10 arası (ai_player.py'de /200 yapılıyor)
                    "target_win_rate": 8,           # 0-10 arası (ai_player.py'de /10 yapılıyor)
                    "fairness": 3,                  # 0-10 arası (ai_player.py'de lose_probability hesabı)
                    "max_consecutive_wins": 7,      # Doğrudan kullanılıyor

                    # YENİ ÖZELLİKLER
                    "rage_mode": True,              # Boolean
                    "fatigue_system": True,         # Boolean
                    "focus_mode": True,             # Boolean
                    "adaptive_difficulty": True     # Boolean
                }
            },
            "duration": 15
        }
    ]

    print(f"⚡ {len(test_configs)} client aynı anda başlatılıyor...")
    print("🕐 Başlangıç zamanı:", time.strftime("%H:%M:%S"))
    print()

    # TÜM CLIENT'LARI AYNI ANDA BAŞLAT
    tasks = []

    for config in test_configs:
        task = asyncio.create_task(
            test_client(
                config["client_name"],
                config["game_id"],
                config["ai_config"],
                config["duration"]
            )
        )
        tasks.append(task)

    # Başlangıç zamanını kaydet
    start_time = time.time()

    # Tüm testlerin tamamlanmasını bekle
    await asyncio.gather(*tasks)

    # Toplam süreyi hesapla
    total_time = time.time() - start_time

    print("🎉 TÜM TESTLER TAMAMLANDI!")
    print("=" * 60)
    print(f"🕐 Bitiş zamanı: {time.strftime('%H:%M:%S')}")
    print(f"⏱️ Toplam test süresi: {total_time:.1f} saniye")
    print(f"🤖 Test edilen AI sayısı: {len(test_configs)}")
    print(f"⚡ Ortalama client başına süre: {total_time/len(test_configs):.1f}s")

async def run_stress_test():
    """10 adet medium AI ile stress testi"""
    print("🔥 PERFORMANS STRESS TESTİ")
    print("=" * 40)

    # 10 adet medium AI
    tasks = []
    client_count = 10

    print(f"⚡ {client_count} adet Medium AI aynı anda başlatılıyor...")
    print()

    for i in range(client_count):
        config = {
            "client_name": f"🤖 AI-{i+1:02d}",
            "game_id": f"stress_game_{i+1:02d}",
            "ai_config": {"difficulty": "medium"},
            "duration": 10
        }

        task = asyncio.create_task(
            test_client(
                config["client_name"],
                config["game_id"],
                config["ai_config"],
                config["duration"]
            )
        )
        tasks.append(task)

    start_time = time.time()
    await asyncio.gather(*tasks)
    total_time = time.time() - start_time

    print("⚡ STRESS TEST TAMAMLANDI!")
    print("=" * 40)
    print(f"⏱️ Toplam süre: {total_time:.1f}s")
    print(f"🤖 Client sayısı: {client_count}")
    print(f"📊 Ortalama client/süre: {total_time/client_count:.1f}s")

async def run_custom_ai_showcase():
    """Farklı özel AI konfigürasyonlarını test et"""
    print("🎨 ÖZEL AI VİTRİNİ")
    print("=" * 30)

    custom_configs = [
        {
            "name": "🎯 SNIPER AI",
            "settings": {
                "reaction_speed": 10,
                "prediction_accuracy": 10,
                "prepare_distance": 10,
                "freeze_distance": 9,
                "accuracy": 10,
                "learning_rate": 8,
                "target_win_rate": 9,
                "fairness": 1,
                "max_consecutive_wins": 10,
                "rage_mode": False,
                "fatigue_system": False,
                "focus_mode": True,
                "adaptive_difficulty": False
            }
        },
        {
            "name": "😴 LAZY AI",
            "settings": {
                "reaction_speed": 3,
                "prediction_accuracy": 4,
                "prepare_distance": 2,
                "freeze_distance": 1,
                "accuracy": 3,
                "learning_rate": 1,
                "target_win_rate": 2,
                "fairness": 8,
                "max_consecutive_wins": 1,
                "rage_mode": False,
                "fatigue_system": True,
                "focus_mode": False,
                "adaptive_difficulty": True
            }
        },
        {
            "name": "😡 RAGE AI",
            "settings": {
                "reaction_speed": 8,
                "prediction_accuracy": 7,
                "prepare_distance": 6,
                "freeze_distance": 5,
                "accuracy": 7,
                "learning_rate": 9,
                "target_win_rate": 8,
                "fairness": 2,
                "max_consecutive_wins": 5,
                "rage_mode": True,
                "fatigue_system": False,
                "focus_mode": False,
                "adaptive_difficulty": False
            }
        }
    ]

    tasks = []

    for i, config in enumerate(custom_configs):
        ai_config = {
            "difficulty": "custom",
            "custom_settings": config["settings"]
        }

        task = asyncio.create_task(
            test_client(
                config["name"],
                f"showcase_game_{i+1}",
                ai_config,
                12
            )
        )
        tasks.append(task)

    start_time = time.time()
    await asyncio.gather(*tasks)
    total_time = time.time() - start_time

    print("🎨 ÖZEL AI VİTRİNİ TAMAMLANDI!")
    print("=" * 30)
    print(f"⏱️ Toplam süre: {total_time:.1f}s")

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        test_type = sys.argv[1]

        if test_type == "--multi":
            # Çoklu seviye testi (5 farklı AI)
            asyncio.run(run_simultaneous_multi_level_test())

        elif test_type == "--stress":
            # Stress testi (10 adet medium AI)
            asyncio.run(run_stress_test())

        elif test_type == "--showcase":
            # Özel AI vitrini
            asyncio.run(run_custom_ai_showcase())

        else:
            print("Kullanım:")
            print("python multi_client_test_2.py --multi      # 5 farklı seviye AI")
            print("python multi_client_test_2.py --stress     # 10 adet medium AI")
            print("python multi_client_test_2.py --showcase   # Özel AI vitrini")
    else:
        # Varsayılan: Çoklu seviye testi
        asyncio.run(run_simultaneous_multi_level_test())
