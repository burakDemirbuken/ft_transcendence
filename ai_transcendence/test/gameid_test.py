# test_client.py
import asyncio
import websockets
import json
import time
import random

class PingPongTestClient:
    def __init__(self):
        self.game_id = None
        self.websocket = None
        self.ball_x = 400
        self.ball_y = 300
        self.ball_speed_x = 5
        self.ball_speed_y = 3
        self.ai_paddle_y = 250
        self.human_paddle_y = 250
        self.paddle_height = 80
        self.game_width = 800
        self.game_height = 600

        # Skor takibi
        self.ai_score = 0
        self.human_score = 0

    async def connect_and_test(self):
        """WebSocket'e bağlan ve test et"""
        try:
            print("🔗 WebSocket sunucusuna bağlanıyor...")
            async with websockets.connect("ws://localhost:3000") as websocket:
                self.websocket = websocket
                print("✅ Bağlantı başarılı!")

                # 1. Oyun başlat
                await self.initialize_game()

                # 2. Test senaryolarını çalıştır
                await self.run_test_scenarios()

        except Exception as e:
            print(f"❌ Bağlantı hatası: {e}")

    async def initialize_game(self):
        """Oyunu başlat"""
        print("\n🎮 Oyun başlatılıyor...")

        init_message = {
            "type": "init_game",
            "ai_config": {
                "difficulty": "medium"
            }
        }

        await self.websocket.send(json.dumps(init_message))

        # Yanıtı bekle
        response = await self.websocket.recv()
        data = json.loads(response)

        if data.get("success"):
            self.game_id = data.get("game_id")
            print(f"✅ Oyun başlatıldı! Game ID: {self.game_id}")
        else:
            print(f"❌ Oyun başlatılamadı: {data.get('error')}")
            raise Exception("Oyun başlatılamadı")

    async def send_game_data(self, scored_for_ai=False, scored_for_human=False):
        """Oyun verisini gönder"""
        game_data = {
            "type": "game_data",
            "game_id": self.game_id,  # ← Game ID eklendi!
            "ball": {
                "x": self.ball_x,
                "y": self.ball_y,
                "speed_x": self.ball_speed_x,
                "speed_y": self.ball_speed_y
            },
            "paddle": {
                "ai_y": self.ai_paddle_y,
                "height": self.paddle_height
            },
            "game_area": {
                "width": self.game_width,
                "height": self.game_height
            },
            "scored_for_me": scored_for_ai,
            "scored_against_me": scored_for_human
        }

        await self.websocket.send(json.dumps(game_data))

        # AI kararını bekle
        response = await self.websocket.recv()
        ai_response = json.loads(response)

        if ai_response.get("type") == "ai_decision":
            target_y = ai_response.get("target_y")
            print(f"🤖 AI kararı: Hedef Y = {target_y:.1f}")
            return target_y
        else:
            print(f"❌ Beklenmeyen yanıt: {ai_response}")
            return None

    def simulate_ball_movement(self):
        """Topun hareketini simüle et"""
        self.ball_x += self.ball_speed_x
        self.ball_y += self.ball_speed_y

        # Üst/alt duvar çarpması
        if self.ball_y <= 0 or self.ball_y >= self.game_height:
            self.ball_speed_y = -self.ball_speed_y
            self.ball_y = max(0, min(self.game_height, self.ball_y))

        # Sağ duvar (AI kaybeder)
        if self.ball_x >= self.game_width:
            self.human_score += 1
            self.reset_ball()
            return "human_scored"

        # Sol duvar (Human kaybeder)
        if self.ball_x <= 0:
            self.ai_score += 1
            self.reset_ball()
            return "ai_scored"

        return None

    def reset_ball(self):
        """Topu merkeze sıfırla"""
        self.ball_x = self.game_width // 2
        self.ball_y = self.game_height // 2
        self.ball_speed_x = random.choice([-5, 5])
        self.ball_speed_y = random.uniform(-3, 3)

    async def run_test_scenarios(self):
        """Test senaryolarını çalıştır"""
        print("\n🧪 Test senaryoları başlıyor...\n")

        # Test 1: Normal oyun simülasyonu
        await self.test_normal_gameplay()

        # Test 2: AI skor kazanması
        await self.test_ai_scoring()

        # Test 3: AI skor kaybetmesi
        await self.test_ai_losing()

        # Test 4: Farklı top pozisyonları
        await self.test_different_positions()

    async def test_normal_gameplay(self):
        """Normal oyun akışını test et"""
        print("📋 Test 1: Normal Oyun Akışı")
        print("-" * 40)

        for i in range(10):
            print(f"Frame {i+1:2d}: Top({self.ball_x:3.0f},{self.ball_y:3.0f}) ", end="")

            target_y = await self.send_game_data()

            if target_y is not None:
                # AI paddle'ını hedefe doğru hareket ettir
                diff = target_y - self.ai_paddle_y
                if abs(diff) > 5:
                    self.ai_paddle_y += 5 if diff > 0 else -5

            # Top hareketini simüle et
            score_event = self.simulate_ball_movement()

            if score_event:
                print(f" → {score_event.upper()}!")
                break
            else:
                print(f" → AI Paddle: {self.ai_paddle_y:.0f}")

            await asyncio.sleep(0.1)  # 100ms bekle

        print(f"Skor: AI {self.ai_score} - {self.human_score} Human\n")

    async def test_ai_scoring(self):
        """AI'ın skor kazanmasını test et"""
        print("📋 Test 2: AI Skor Kazanma")
        print("-" * 40)

        # AI skor kazandı mesajı gönder
        target_y = await self.send_game_data(scored_for_ai=True)
        print(f"✅ AI skor kazandı! Yeni hedef: {target_y:.1f}")

        await asyncio.sleep(0.5)

    async def test_ai_losing(self):
        """AI'ın skor kaybetmesini test et"""
        print("📋 Test 3: AI Skor Kaybetme")
        print("-" * 40)

        # AI skor kaybetti mesajı gönder
        target_y = await self.send_game_data(scored_for_human=True)
        print(f"❌ AI skor kaybetti! Yeni hedef: {target_y:.1f}")

        await asyncio.sleep(0.5)

    async def test_different_positions(self):
        """Farklı top pozisyonlarını test et"""
        print("📋 Test 4: Farklı Top Pozisyonları")
        print("-" * 40)

        test_positions = [
            (100, 100, 5, 2),   # Sol üst
            (100, 500, 5, -2),  # Sol alt
            (700, 300, -5, 0),  # Sağ merkez (AI'a geliyor)
            (600, 150, -3, 4),  # AI'a yaklaşıyor
        ]

        for i, (x, y, sx, sy) in enumerate(test_positions):
            self.ball_x, self.ball_y = x, y
            self.ball_speed_x, self.ball_speed_y = sx, sy

            print(f"Pozisyon {i+1}: Top({x},{y}) Hız({sx},{sy}) ", end="")
            target_y = await self.send_game_data()
            print(f"→ AI Hedef: {target_y:.1f}")

            await asyncio.sleep(0.2)

# Test çalıştırıcı
async def main():
    print("🚀 Ping Pong AI Test Başlıyor...")
    print("=" * 50)

    client = PingPongTestClient()
    await client.connect_and_test()

    print("\n✅ Test tamamlandı!")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Test durduruldu.")
