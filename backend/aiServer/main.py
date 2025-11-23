import json
import asyncio
import websockets
from ai_player import PingPongAI
import uuid
from typing import Dict, Optional

class GameAIManager:
    """Oyun AI'larını yöneten sınıf"""

    def __init__(self):
        self.game_ais: Dict[str, PingPongAI] = {}  # game_id -> AI instance
        self.client_games: Dict[str, str] = {}     # client_id -> game_id

    def create_game_ai(self, game_id: str, ai_config: dict) -> str:
        """Yeni bir oyun AI'ı oluştur"""
        if game_id in self.game_ais:
            print(f"Oyun {game_id} zaten mevcut, mevcut AI kullanılacak")
            return game_id

        # AI'ı oluştur
        difficulty = ai_config.get('difficulty')

        if difficulty == 'custom':
            custom_settings = ai_config.get('custom_settings', {})
            ai_player = PingPongAI('custom', custom_settings)
        else:
            ai_player = PingPongAI(difficulty)

        # Cache'e kaydet
        self.game_ais[game_id] = ai_player
        print(f"Oyun {game_id} için {difficulty} seviyesinde AI oluşturuldu")

        return game_id

    def assign_client_to_game(self, client_id: str, game_id: str):
        """Client'ı bir oyuna ata"""
        if game_id not in self.game_ais:
            raise ValueError(f"Oyun {game_id} bulunamadı")

        self.client_games[client_id] = game_id
        print(f"Client {client_id} -> Oyun {game_id} atandı")

    def get_ai_for_client(self, client_id: str) -> Optional[PingPongAI]:
        """Client için AI'ı getir"""
        game_id = self.client_games.get(client_id)
        if not game_id:
            return None

        return self.game_ais.get(game_id)

    def get_client_game_id(self, client_id: str) -> Optional[str]:
        """Client'ın oyun ID'sini getir"""
        return self.client_games.get(client_id)

    def remove_client(self, client_id: str):
        """Client'ı sistemden çıkar"""
        if client_id in self.client_games:
            game_id = self.client_games[client_id]
            del self.client_games[client_id]
            print(f"Client {client_id} oyun {game_id}'den çıkarıldı")

    def cleanup_empty_games(self):
        """Boş oyunları temizle"""
        active_games = set(self.client_games.values())
        games_to_remove = []

        for game_id in self.game_ais.keys():
            if game_id not in active_games:
                games_to_remove.append(game_id)

        for game_id in games_to_remove:
            del self.game_ais[game_id]
            print(f"Boş oyun {game_id} temizlendi")

def convert_decision_to_direction(decision):
    """AI kararını direction string'ine çevir"""
    if decision == -1:
        return "up"
    elif decision == 1:
        return "down"
    else:
        return "stable"

def get_ai_decision(ai_player: PingPongAI, game_data: dict):
    """Mevcut AI ile karar ver"""
    ball = game_data.get('ball') or {}
    paddle = game_data.get('paddle') or {}
    game_area = game_data.get('game_area') or {}
    score = game_data.get('score') or {}

    # Varsayılanlar
    bx = ball.get('x', 0)
    by = ball.get('y', 0)
    bvx = ball.get('speed_x', 0)
    bvy = ball.get('speed_y', 0)
    ai_y = paddle.get('ai_y', 0)
    width = game_area.get('width', 800)
    height = game_area.get('height', 600)
    ai_scored = score.get('ai_scored', False)
    human_scored = score.get('human_scored', False)

    # AI'a oyun alanı bilgilerini ver (eğer AI class'ı destekliyorsa)
    if hasattr(ai_player, 'set_game_area'):
        ai_player.set_game_area(width, height)

    # AI'a raket bilgilerini ver (eğer AI class'ı destekliyorsa)
    if hasattr(ai_player, 'set_paddle_info'):
        ai_player.set_paddle_info(paddle.get('length', 80))

    # AI kararını al
    decision = ai_player.get_move(
        bx, by,
        bvx, bvy,
        ai_y,
        ai_scored,
        human_scored
    )

    return decision

# Global AI Manager
ai_manager = GameAIManager()

async def handle_client(websocket, path=None):
    """WebSocket istemcisini işle"""
    client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}:{id(websocket)}"
    print(f"Yeni bağlantı: {client_id}")

    try:
        async for message in websocket:
            try:
                # JSON'u parse et
                data = json.loads(message)
                message_type = data.get('type', 'game_data')

                if message_type == 'init_game':
                    # Oyun başlatma mesajı
                    await handle_init_game(websocket, client_id, data)

                elif message_type == 'join_game':
                    # Mevcut oyuna katılma mesajı
                    await handle_join_game(websocket, client_id, data)

                elif message_type == 'game_data':
                    # Normal oyun verisi
                    await handle_game_data(websocket, client_id, data)

                else:
                    # Eski format desteği (geriye uyumluluk)
                    if 'ai_config' in data:
                        # İlk mesaj, oyun başlatma
                        await handle_legacy_init(websocket, client_id, data)
                    else:
                        # Normal oyun verisi
                        await handle_game_data(websocket, client_id, data)

            except json.JSONDecodeError as e:
                print(f"JSON parse hatası: {e}")
                await websocket.send(json.dumps({"error": "Invalid JSON"}))

            except Exception as e:
                print(f"İşlem hatası: {e}")
                import traceback
                traceback.print_exc()
                await websocket.send(json.dumps({"error": str(e)}))

    except websockets.exceptions.ConnectionClosed:
        print(f"Bağlantı kapandı: {client_id}")
    except Exception as e:
        print(f"WebSocket hatası: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Client ayrıldığında temizlik yap
        ai_manager.remove_client(client_id)
        ai_manager.cleanup_empty_games()

async def handle_init_game(websocket, client_id: str, data: dict):
    """Yeni oyun başlatma"""
    try:
        ai_config = data.get('ai_config', {})
        game_id = data.get('game_id')

        # Game ID yoksa otomatik oluştur
        if not game_id:
            game_id = str(uuid.uuid4())[:8]  # Kısa ID

        # AI oluştur ve oyunu başlat
        ai_manager.create_game_ai(game_id, ai_config)
        ai_manager.assign_client_to_game(client_id, game_id)

        print("\n" + "="*80)
        print(f"📥 GELEN OYUN VERİSİ - Client: {client_id}")
        print("="*80)
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print("="*80 + "\n")

        # AI Config varsa göster
        ai_config = data.get('ai_config', {})
        if ai_config:
            print("🔧 AI KONFIGÜRASYONU:")
            print(json.dumps(ai_config, indent=2, ensure_ascii=False))
            print()

        # Custom settings varsa göster
        custom_settings = data.get('custom_settings', {})
        if custom_settings:
            print("⚙️ CUSTOM AYARLAR:")
            print(json.dumps(custom_settings, indent=2, ensure_ascii=False))
            print()

        response = {
            "type": "game_initialized",
            "game_id": game_id,
            "ai_difficulty": ai_config.get('difficulty'),
            "success": True
        }

        await websocket.send(json.dumps(response))
        print(f"Oyun başlatıldı: {game_id} (Client: {client_id})")

    except Exception as e:
        response = {
            "type": "game_initialized",
            "success": False,
            "error": str(e)
        }
        await websocket.send(json.dumps(response))

async def handle_join_game(websocket, client_id: str, data: dict):
    """Mevcut oyuna katılma"""
    try:
        game_id = data.get('game_id')

        if not game_id or game_id not in ai_manager.game_ais:
            raise ValueError(f"Oyun {game_id} bulunamadı")

        ai_manager.assign_client_to_game(client_id, game_id)

        response = {
            "type": "game_joined",
            "game_id": game_id,
            "success": True
        }

        await websocket.send(json.dumps(response))
        print(f"Oyuna katıldı: {game_id} (Client: {client_id})")

    except Exception as e:
        response = {
            "type": "game_joined",
            "success": False,
            "error": str(e)
        }
        await websocket.send(json.dumps(response))

async def handle_game_data(websocket, client_id: str, data: dict):
    """Oyun verisini işle ve AI kararını döndür"""
    try:
        game_id = data.get('game_id')
        print(f"Handling game data for client {client_id} with game_id {game_id}")

        print("\n" + "="*80)
        print(f"📥 GELEN OYUN VERİSİ - Client: {client_id}")
        print("="*80)
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print("="*80 + "\n")

        ai_player = None

        # ✅ ÖNCE VAR OLAN AI'YI KONTROL ET
        if game_id and game_id in ai_manager.game_ais:
            # AI zaten var, kullan
            ai_player = ai_manager.game_ais[game_id]
            print(f"✅ Mevcut AI kullanılıyor: {game_id}")

        # ✅ EĞER AI YOKSA VE game_id VARSA, OLUŞTUR
        elif game_id:
            ai_config = data.get('ai_config', {})
            if ai_config:
                print(f"🆕 Yeni AI oluşturuluyor: {game_id}")
                ai_manager.create_game_ai(str(game_id), ai_config)
                ai_manager.assign_client_to_game(client_id, str(game_id))
                ai_player = ai_manager.game_ais.get(str(game_id))
                game_id = str(game_id)

        # ✅ EĞER game_id YOKSA, CLIENT EŞLEŞMESİNDEN BULA
        else:
            ai_player = ai_manager.get_ai_for_client(client_id)
            game_id = ai_manager.get_client_game_id(client_id)
            if not ai_player:
                # Client için bir oyun ve AI yoksa otomatik oluştur
                auto_game_id = str(uuid.uuid4())[:8]
                ai_manager.create_game_ai(auto_game_id, ai_config)
                ai_manager.assign_client_to_game(client_id, auto_game_id)
                ai_player = ai_manager.get_ai_for_client(client_id)
                game_id = auto_game_id

        # 2) AI kararını al
        ball = data.get('ball') or {}
        paddle = data.get('paddle') or {}
        game_area = data.get('game_area') or {}

        bx = ball.get('x')
        by = ball.get('y')
        bvx = ball.get('speed_x')
        bvy = ball.get('speed_y')
        ai_y = paddle.get('ai_y')
        paddle_h = paddle.get('height', 100)
        area_h = game_area.get('height', 600)

        can_compute = all(v is not None for v in [bx, by, bvx, bvy, ai_y])

        if can_compute:
            print(f"[AI INPUT] bx={bx:.2f}, by={by:.2f}, bvx={bvx:.2f}, bvy={bvy:.2f}, ai_y={ai_y:.2f}, ph={paddle_h}, ah={area_h}")
            target_y = ai_player.get_move(
                bx, by,
                bvx, bvy,
                ai_y, paddle_h, area_h,
                data.get('scored_for_me', False), data.get('scored_against_me', False)
            )
            try:
                is_zeroish = abs(float(target_y)) < 1e-6
            except Exception:
                is_zeroish = False

            if is_zeroish and (abs(bvx) > 1e-3 or abs(bvy) > 1e-3):
                simple_target = max(paddle_h/2, min(area_h - paddle_h/2, by))
                target_y = simple_target - paddle_h/2
                print(f"[AI OUTPUT-FALLBACK] target_y={target_y:.2f}")
            else:
                print(f"[AI OUTPUT] target_y={target_y:.2f}")
        else:
            target_y = (ai_y or 0)
            try:
                print(f"[AI OUTPUT-NOCOMPUTE] target_y={float(target_y):.2f}")
            except Exception:
                print(f"[AI OUTPUT-NOCOMPUTE] target_y={target_y}")

        import time
        print(f"[{time.strftime('%H:%M:%S')}] Oyun {game_id} - AI karar verdi: Hedef Y = {target_y:.2f}")
        if can_compute:
            print(f"  Top: ({bx:.1f}, {by:.1f}), Hız: ({bvx:.1f}, {bvy:.1f})")
            print(f"  Raket: Y = {ai_y:.1f}")
        else:
            print("  Eksik alan(lar) nedeniyle önceki target_y korundu")

        response = {
            "type": "ai_decision",
            "target_y": target_y,
            "game_id": game_id
        }

        try:
            print(f"[AI DECISION] game_id={game_id} target_y={float(target_y):.2f}")
        except Exception:
            print(f"[AI DECISION] game_id={game_id} target_y={target_y}")

        await websocket.send(json.dumps(response))

    except Exception as e:
        print(f"Oyun verisi işleme hatası: {e}")
        import traceback
        traceback.print_exc()
        await websocket.send(json.dumps({"error": str(e)}))

async def handle_legacy_init(websocket, client_id: str, data: dict):
    """Eski format oyun başlatma (geriye uyumluluk)"""
    try:
        ai_config = data.get('ai_config', {})
        game_id = data.get("game_id")

        # AI oluştur ve oyunu başlat
        ai_manager.create_game_ai(game_id, ai_config)
        ai_manager.assign_client_to_game(client_id, game_id)

        print(f"Eski format ile oyun başlatıldı: {game_id} (Client: {client_id})")

        # Oyun verisini işle
        await handle_game_data(websocket, client_id, data)

    except Exception as e:
        print(f"Eski format başlatma hatası: {e}")
        import traceback
        traceback.print_exc()
        await websocket.send(json.dumps({"error": str(e)}))

print("==> main.py başlatıldı")

import sys
print("==> Argümanlar:", sys.argv)

# Ana kullanım
if __name__ == "__main__":
    print("==> __main__ bloğuna girildi")

    if len(sys.argv) > 1 and sys.argv[1] == "--websocket":
        # WebSocket modu
        print("WebSocket sunucusu başlatılıyor...")
        print("Adres: ws://localhost:3003")

        async def start_websocket_server():
            """WebSocket sunucusunu başlat"""
            print("WebSocket sunucusu çalışıyor. Bağlantı bekleniyor...")

            # Sunucuyu başlat
            server = await websockets.serve(handle_client, "0.0.0.0", 3003)

            # Sunucuyu sonsuza kadar çalıştır
            await server.wait_closed()

        # Event loop'u başlat
        try:
            asyncio.run(start_websocket_server())
        except KeyboardInterrupt:
            print("\nSunucu kapatılıyor...")
