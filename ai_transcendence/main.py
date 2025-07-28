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
        difficulty = ai_config.get('difficulty', 'medium')

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
    # Oyun verilerini al
    ball = game_data['ball']
    paddle = game_data['paddle']
    game_area = game_data.get('game_area', {})
    score = game_data.get('score', {})

    # AI'a oyun alanı bilgilerini ver (eğer AI class'ı destekliyorsa)
    if game_area and hasattr(ai_player, 'set_game_area'):
        ai_player.set_game_area(game_area['width'], game_area['height'])

    # AI'a raket bilgilerini ver (eğer AI class'ı destekliyorsa)
    if hasattr(ai_player, 'set_paddle_info'):
        ai_player.set_paddle_info(paddle.get('length', 80))

    # AI kararını al
    decision = ai_player.get_move(
        ball['x'], ball['y'],
        ball['speed_x'], ball['speed_y'],
        paddle['ai_y'],
        score.get('ai_scored', False),
        score.get('human_scored', False)
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

        response = {
            "type": "game_initialized",
            "game_id": game_id,
            "ai_difficulty": ai_config.get('difficulty', 'medium'),
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
    """Normal oyun verisi işleme"""
    try:
        # Client'ın AI'ını bul
        ai_player = ai_manager.get_ai_for_client(client_id)
        if not ai_player:
            raise ValueError("Client için AI bulunamadı. Önce oyun başlatın.")

        # AI kararını al
        decision = get_ai_decision(ai_player, data)
        direction = convert_decision_to_direction(decision)

        # Cevabı hazırla
        response = {
            "type": "ai_decision",
            "direction": direction,
            "game_id": ai_manager.get_client_game_id(client_id)
        }

        await websocket.send(json.dumps(response))

    except Exception as e:
        response = {
            "type": "ai_decision",
            "error": str(e)
        }
        await websocket.send(json.dumps(response))

async def handle_legacy_init(websocket, client_id: str, data: dict):
    """Eski format desteği (geriye uyumluluk)"""
    try:
        ai_config = data.get('ai_config', {})
        game_id = str(uuid.uuid4())[:8]

        # AI oluştur
        ai_manager.create_game_ai(game_id, ai_config)
        ai_manager.assign_client_to_game(client_id, game_id)

        # Aynı mesajı game_data olarak işle
        data_copy = data.copy()
        del data_copy['ai_config']  # ai_config'i çıkar

        await handle_game_data(websocket, client_id, data_copy)

    except Exception as e:
        response = {"error": str(e)}
        await websocket.send(json.dumps(response))

# Ana kullanım
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--websocket":
        # WebSocket modu
        print("WebSocket sunucusu başlatılıyor...")
        print("Adres: ws://localhost:3000")

        async def start_websocket_server():
            """WebSocket sunucusunu başlat"""
            print("WebSocket sunucusu çalışıyor. Bağlantı bekleniyor...")

            # Sunucuyu başlat
            server = await websockets.serve(handle_client, "localhost", 3000)

            # Sunucuyu sonsuza kadar çalıştır
            await server.wait_closed()

        # Event loop'u başlat
        try:
            asyncio.run(start_websocket_server())
        except KeyboardInterrupt:
            print("\nSunucu kapatılıyor...")
