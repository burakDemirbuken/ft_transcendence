import json
from ai_player import PingPongAI

def load_game_data(json_file):
    """JSON dosyasından oyun verilerini yükle"""
    with open(json_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_ai(ai_config):
    """AI oyuncusu oluştur"""
    difficulty = ai_config.get('difficulty', 'medium')
    
    if difficulty == 'custom':
        custom_settings = ai_config.get('custom_settings', {})
        return PingPongAI('custom', custom_settings)
    else:
        return PingPongAI(difficulty)

def convert_decision_to_direction(decision):
    """AI kararını direction string'ine çevir"""
    if decision == -1:
        return "up"
    elif decision == 1:
        return "down"
    else:
        return "stable"

def save_ai_decision_to_file(output_file, direction):
    """AI kararını ayrı bir JSON dosyasına kaydet"""
    try:
        ai_decision_data = {
            "direction": direction
        }
        
        # Yeni JSON dosyasına kaydet
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(ai_decision_data, f, indent=2, ensure_ascii=False)
            
        return True
    except Exception as e:
        print(f"JSON kaydetme hatası: {e}")
        return False

def get_ai_decision(game_data):
    """AI kararını ver"""
    # AI'ı oluştur
    ai_player = create_ai(game_data['ai_config'])
    
    # Oyun verilerini al
    ball = game_data['ball']
    paddle = game_data['paddle']
    game_area = game_data['game_area']
    score = game_data['score']
    
    # AI'a oyun alanı bilgilerini ver (eğer AI class'ı destekliyorsa)
    if hasattr(ai_player, 'set_game_area'):
        ai_player.set_game_area(game_area['width'], game_area['height'])
    
    # AI'a raket bilgilerini ver (eğer AI class'ı destekliyorsa)
    if hasattr(ai_player, 'set_paddle_info'):
        ai_player.set_paddle_info(paddle['length'])
    
    # AI kararını al
    decision = ai_player.get_move(
        ball['x'], ball['y'], 
        ball['speed_x'], ball['speed_y'],
        paddle['ai_y'],
        score.get('ai_scored', False),
        score.get('human_scored', False)
    )
    
    return decision, ai_player

# Ana kullanım
if __name__ == "__main__":
    input_file = 'data.json'      # Oyundan gelen veri
    output_file = 'ai_decision.json'   # AI kararının yazılacağı dosya
    
    # JSON dosyasını yükle
    game_data = load_game_data(input_file)
    
    # AI kararını al
    decision, ai = get_ai_decision(game_data)
    
    # Kararı direction'a çevir
    direction = convert_decision_to_direction(decision)
    
    # Ayrı dosyaya kaydet
    if save_ai_decision_to_file(output_file, direction):
        print(f"AI Kararı '{output_file}' dosyasına kaydedildi: {direction}")
    else:
        print("JSON kaydetme başarısız!")
    
    # Konsola da yazdır
    print(f"AI Kararı: {decision} -> {direction}")
